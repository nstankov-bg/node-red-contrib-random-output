module.exports = function (RED) {
  
  // Helper functions
  function executeCommand(context, node, outputNum, command) {
    if (command) {
      node.log(`Executing command "${command}" on output ${outputNum}`);
      let outputData = context.get(`outputData${outputNum}`) || {};
      outputData.lastCommandExecutedTime = Date.now();
      context.set(`outputData${outputNum}`, outputData);
    }
  }

  function startTimer(context, node, outputNum, timerDuration, command) {
    setTimeout(() => {
      node.log(`Timer expired for output ${outputNum}. Executing second command.`);
      executeCommand(context, node, outputNum, command);
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
    
    // Initialize context variables if they are undefined
    context.set("lastElectedNode", context.get("lastElectedNode") || "");


    const ReElectionBan = config.reelectionBan * 1000;
    const ElectionTime = config.electionTime * 1000;
    const Commands = config.commands; // Assume this is an array of commands for each output
    const TimerDurations = config.timerDurations; // Assume this is an array of timer durations for each output

    const numberOfOutputs = Math.min(config.outputs - 1, 300); // Limit to 300 outputs

    node.on("input", function (msg) {
      // Your existing logic here
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
          if (electNode(context, node, restartOutputNode, ReElectionBan) == true) {
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
          if (electNode(context, node, chosen, ReElectionBan) == true) {
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

      // Execute the command on the chosen output
      executeCommand(context, node, chosen, Commands[chosen]);

      // Start a timer for the chosen output
      startTimer(context, node, chosen, TimerDurations[chosen], Commands[chosen]);
    });
  }
  
  RED.nodes.registerType("random-output-advanced", RandomOutputNode);
};
