module.exports = function (RED) {
  function electNode(context, node, outputNum, ReElectionBan) {
    //Check if outputNum is eligible for re-election
    node.log(
      "node-red-contrib: Checking if output " +
        outputNum +
        " is eligible for re-election"
    );
    if (
      checkReelectionEligibility(context, outputNum, node, ReElectionBan) ==
      true
    ) {
      context.set("lastElectedNode", outputNum);
      context.set("lastElectedTime" + outputNum, Date.now());
      context.set(
        "ElectionBannedUntill" + outputNum,
        Date.now() + ReElectionBan
      );
      node.log(
        "node-red-contrib: Node " + outputNum + " is eligible for re-election"
      );
      node.log(
        "node-red-contrib: Elected node " +
          context.get("lastElectedNode") +
          " at " +
          context.get("lastElectedTime" + outputNum)
      );
      return true;
    } else {
      node.log(
        "node-red-contrib: Node " +
          outputNum +
          " will be eligable at: " +
          context.get("ElectionBannedUntill" + outputNum)
      );
      node.log(
        "node-red-contrib: " + outputNum + " is not eligible for re-election"
      );
      return false;
    }
  }
  function checkReelectionEligibility(context, outputNum) {
    //check if the node is eligible for re-election
    if (context.get("ElectionBannedUntill" + outputNum) > Date.now()) {
      return false;
    } else if (context.get("ElectionBannedUntill" + outputNum) < Date.now()) {
      return true;
    } else {
      return true;
    }
  }

  function RandomOutputNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let context = this.context();

    //4 hours
    const ReElectionBan = 4 * 60 * 60 * 1000; //4 hours
    const ElectionTime = 5000; //5 seconds

    const numberOfOutputs = config.outputs - 1;

    node.on("input", function (msg) {
      node.log("------------------------------------------------------");
      node.log("node-red-contrib: Random Output Node created");
      node.log("node-red-contrib: Number of outputs: " + (numberOfOutputs + 1));

      if (context.get("lastElectedNode") !== undefined) {
        node.log(
          "node-red-contrib: Currently elected node: " +
            context.get("lastElectedNode")
        );
        node.log(
          "node-red-contrib: Last elected time: " +
            context.get("lastElectedTime" + context.get("lastElectedNode"))
        );
        node.log("node-red-contrib: Current Unix Time: " + Date.now());
      } else {
        node.log("node-red-contrib: No node has been elected yet");
      }
      node.log("------------------------------------------------------");

      let output = new Array(numberOfOutputs);
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
          if (context.get("lastElectedNode") + 1 > numberOfOutputs) {
            restartOutputNode = 0;
          } else {
            restartOutputNode = context.get("lastElectedNode") + 1;
          }
          if (
            electNode(context, node, restartOutputNode, ReElectionBan) == true
          ) {
            chosen = context.get("lastElectedNode");
            output[chosen] = msg;
            node.send(output);
          } else {
            nextRestartNode = restartOutputNode + 1;
            electNode(context, node, nextRestartNode, ReElectionBan);
          }
        }
      } else {
        for (let outputNum = -1; outputNum < numberOfOutputs; outputNum++) {
          chosen = outputNum;
          //Make sure that chosen is a positive number
          if (chosen < 0) {
            chosen = chosen + 1;
          }
          if (electNode(context, node, chosen, ReElectionBan) == true) {
            node.log("node-red-contrib: Elected node " + chosen);
            break;
          } else {
            node.log("node-red-contrib: Node " + chosen + " is banned");
            electNode(context, node, chosen + 1, ReElectionBan);
          }
        }
        chosen = context.get("lastElectedNode");
        output[chosen] = msg;
        node.send(output);
      }
    });
  }
  RED.nodes.registerType("random-output-advanced", RandomOutputNode);
};
