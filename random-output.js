module.exports = function (RED) {
  function sendCommand(context, node, outputNum, commandObject) {
    // Update the context data
    let outputData = context.get(`outputData${outputNum}`) || {};
    outputData.lastCommandExecutedTime = Date.now();
    context.set(`outputData${outputNum}`, outputData);

    if (typeof outputNum === "undefined" || outputNum === null) {
      node.error("outputNum is undefined or null");
      return;
    }

    // Create an output array filled with `null`
    let outputArray = Array(outputNum + 1).fill(null);

    // Place the message object at the `outputNum` index
    outputArray[outputNum] = commandObject;
    node.log(
      `Sending command to output ${outputNum}: ${JSON.stringify(commandObject)}`
    );
    // Send the command to the specified output
    node.send(outputArray);
  }

  function executeCommand(context, node, outputNum, command, end = false) {
    if (command) {
      node.log(
        "Timer started for output " + outputNum + ". Executing start command."
      );

      // Make sure the command is in the expected message object format with a payload property
      let messageObject =
        typeof command === "object" && command.payload !== undefined
          ? command
          : { payload: command };

      //Make sure that only one timer can be started for each output at a time, over the span of 10 seconds.
      let outputData = context.get(`outputData${outputNum}`) || {};
      let lastCommandExecutedTime = outputData.lastCommandExecutedTime || 0;

      if (Date.now() - lastCommandExecutedTime < 10000) {
        node.log(
          `Command already sent to output ${outputNum} within the last 10 seconds. Skipping.`
        );
        return;
      } else {
        sendCommand(context, node, outputNum, messageObject);
      }
    }

    if (end) {
      // Define the end command as a JSON object
      let endCommandObject = {
        payload: { multiple: false, data: { 20: false } },
      };

      node.log(
        "Timer expired for output " + outputNum + ". Executing end command."
      );

      //Make sure the same command does not send more than once to the same output for at least 30 seconds.
      let outputData = context.get(`outputData${outputNum}`) || {};
      let lastCommandExecutedTime = outputData.lastCommandExecutedTime || 0;

      if (Date.now() - lastCommandExecutedTime < 30000) {
        node.log(
          `Command already sent to output ${outputNum} within the last 30 seconds. Skipping.`
        );
        return;
      } else {
        sendCommand(context, node, outputNum, endCommandObject);
      }
    }
  }

  function startTimer(
    context,
    node,
    outputNum,
    timerDuration,
    startCommand,
    endCommand = false
  ) {
    // Execute the start command
    executeCommand(context, node, outputNum, startCommand);

    setTimeout(() => {
      node.log(`Timer expired for output ${outputNum}. Executing end command.`);
      // Execute the end command
      executeCommand(context, node, outputNum, null, (end = true));
    }, timerDuration);
  }

  function electNode(context, node, outputNum, ReElectionBan) {
    node.log(
      "node-red-contrib: Checking if output " +
        outputNum +
        " is eligible for re-election"
    );
    if (checkReelectionEligibility(context, outputNum) == true) {
      context.set("lastElectedNode", outputNum);
      context.set("lastElectedTime" + outputNum, Date.now());
      context.set(
        "ElectionBannedUntill" + outputNum,
        Date.now() + ReElectionBan
      );
      node.log(
        "node-red-contrib: Node " + outputNum + " is eligible for re-election"
      );
      return true;
    } else {
      node.log(
        "node-red-contrib: Node " +
          outputNum +
          " will be eligable at: " +
          context.get("ElectionBannedUntill" + outputNum)
      );
      return false;
    }
  }

  function checkReelectionEligibility(context, outputNum) {
    if (context.get("ElectionBannedUntill" + outputNum) > Date.now()) {
      return false;
    } else {
      return true;
    }
  }

  function RandomOutputNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let context = this.context();

    // Initialize context variables if they are undefined
    context.set("lastElectedNode", context.get("lastElectedNode") || "");

    const ReElectionBan = config.reelectionBan * 1000;
    const TimerDuration = ReElectionBan + 5000;
    const EndCommands = { payload: { multiple: false, data: { 20: false } } };

    const ElectionTime = config.electionTime * 1000;
    const numberOfOutputs = Math.min(config.outputs - 1, 300); // Limit to 300 outputs

    node.on("input", function (msg) {
      let output = new Array(numberOfOutputs + 1);
      let chosen;

      if (
        context.get("lastElectedNode") !== "" &&
        context.get("lastElectedNode") !== undefined
      ) {
        chosen = context.get("lastElectedNode");

        if (
          context.get("lastElectedTime" + chosen) > Date.now() - ElectionTime &&
          context.get("lastElectedTime" + chosen) !== undefined
        ) {
          chosen = context.get("lastElectedNode");
          output[chosen] = msg;
          node.send(output);
        } else {
          node.log("node-red-contrib: Election has expired");
          let restartOutputNode;

          if (context.get("lastElectedNode") + 1 > numberOfOutputs) {
            restartOutputNode = 0;
          } else {
            restartOutputNode = context.get("lastElectedNode") + 1;
          }

          if (
            electNode(context, node, restartOutputNode, ReElectionBan) === true
          ) {
            chosen = context.get("lastElectedNode");
            output[chosen] = msg;
            node.send(output);
          } else {
            let nextRestartNode = restartOutputNode + 1;
            electNode(context, node, nextRestartNode, ReElectionBan);
          }
        }
      } else {
        for (let outputNum = 0; outputNum <= numberOfOutputs; outputNum++) {
          chosen = outputNum;

          if (electNode(context, node, chosen, ReElectionBan) === true) {
            node.log("node-red-contrib: Elected node " + chosen);
            break;
          } else {
            node.log("node-red-contrib: Node " + chosen + " is banned");
          }
        }

        chosen = context.get("lastElectedNode");
        output[chosen] = msg;
        node.send(output);
      }

      startTimer(context, node, chosen, TimerDuration, msg, EndCommands);
    });
  }

  RED.nodes.registerType("random-output-advanced", RandomOutputNode);
};
