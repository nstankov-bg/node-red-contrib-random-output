module.exports = function (RED) {
  
  function executeCommand(context, node, outputNum, command, end) {
    if (command) {
      node.log(`Executing command on output ${outputNum}: ${JSON.stringify(command)}`);
  
      // Update the context data
      let outputData = context.get(`outputData${outputNum}`) || {};
      outputData.lastCommandExecutedTime = Date.now();
      context.set(`outputData${outputNum}`, outputData);
  
      // Create an output array filled with `null`
      let outputArray = Array(outputNum + 1).fill(null);
  
      // Make sure the command is in the expected message object format with a payload property
      let messageObject = (typeof command === 'object' && command.payload !== undefined) ? command : { payload: command };
  
      // Place the message object at the `outputNum` index
      outputArray[outputNum] = messageObject;
  
      // Send the command to the specified output
      node.send(outputArray);
    }
  
    if (end) {
      node.log(`Executing end command on output ${outputNum}: ${JSON.stringify(end)}`);
  
      // Create an output array filled with `null`
      let outputArray = Array(outputNum + 1).fill(null);
  
      // Define the end command as a JSON object
      let endCommandObject = {"payload":{"multiple":false,"data":{"20":false}}};
  
      // Place the end command object at the `outputNum` index
      outputArray[outputNum] = endCommandObject;
  
      // Send the end command to the specified output
      node.send(outputArray);
    }
  }
  

  function startTimer(context, node, outputNum, timerDuration, startCommand, endCommand) {
    // Execute the start command
    executeCommand(context, node, outputNum, startCommand, end=false);
  
    setTimeout(() => {
      node.log(`Timer expired for output ${outputNum}. Executing end command.`);
      // Execute the end command
      executeCommand(context, node, outputNum, endCommand='', end=true);
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
      context.set("ElectionBannedUntill" + outputNum, Date.now() + ReElectionBan);
      node.log("node-red-contrib: Node " + outputNum + " is eligible for re-election");
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
  
    // Timer duration in milliseconds from config
    const TimerDuration = config.timerDuration * 1000;
  
    // Validate end commands
    const EndCommands = config.endCommand;
  
    // Initialize context variables if they are undefined
    context.set("lastElectedNode", context.get("lastElectedNode") || "");
  
    const ReElectionBan = config.reelectionBan * 1000;
    const ElectionTime = config.electionTime * 1000;
    const numberOfOutputs = Math.min(config.outputs - 1, 300); // Limit to 300 outputs
  
    node.on("input", function (msg) {
      let output = new Array(numberOfOutputs + 1);
      let chosen;
  
      if (context.get("lastElectedNode") !== "" && context.get("lastElectedNode") !== undefined) {
        chosen = context.get("lastElectedNode");
  
        if (context.get("lastElectedTime" + chosen) > Date.now() - ElectionTime &&
          context.get("lastElectedTime" + chosen) !== undefined) {
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
  
          if (electNode(context, node, restartOutputNode, ReElectionBan) === true) {
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
  
      if (EndCommands[chosen]) {
        startTimer(context, node, chosen, TimerDuration, msg, EndCommands[chosen]);
      } else {
        node.error(`Invalid command configuration for output ${chosen}`);
      }
    });
  }  
  
  RED.nodes.registerType("random-output-advanced", RandomOutputNode);
};
