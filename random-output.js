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
      context.set("lastElectedTime" + context.get("lastElectedNode"), Date.now());
      //2m minutes to expire
      context.set(
        "lastElectedTimeNode" + context.get("lastElectedNode"),
        Date.now() + ReElectionBan
      );
      node.log(
        "node-red-contrib: Elected node " +
          context.get("lastElectedNode") +
          " at " +
          context.get("lastElectedTime" + context.get("lastElectedNode"))
      );
    } else {
      node.log(outputNum + " is not eligible for re-election");
      return false;
    }
  }
  function checkReelectionEligibility(context, outputNum, node, ReElectionBan) {
    context.get("lastElectedTimeNode" + outputNum);
    //check if the node is eligible for re-election
    if (context.get("lastElectedTimeNode" + outputNum) > Date.now()) {
      node.log(
        "node-red-contrib: Node " +
          outputNum +
          " is not eligible for re-election"
      );
      outputNumNext = outputNum + 1;
      electNode(context, node, outputNumNext, ReElectionBan);
      return false;
    } else {
      node.log(
        "node-red-contrib: Node " + outputNum + " is eligible for re-election"
      );
      return true;
    }
  }

  function RandomOutputNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let context = this.context();

    const ReElectionBan = 120000; //35 seconds
    const ElectionTime = 30000; //30 seconds

    const numberOfOutputs = config.outputs - 1;

    node.on("input", function (msg) {
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

      let output = new Array(numberOfOutputs);
      let chosen;
      if (
        context.get("lastElectedNode") !== "" &&
        context.get("lastElectedNode") !== undefined
      ) {
        chosen = context.get("lastElectedNode");
        if (
          context.get("lastElectedTime" + context.get("lastElectedNode") ) > Date.now() - ElectionTime &&
          context.get("lastElectedTime" + context.get("lastElectedNode")) !== undefined
        ) {
          chosen = context.get("lastElectedNode");
          output[chosen] = msg;
          node.send(output);
        } else {
          node.log("node-red-contrib: Election has expired");
          restartOutputNode = 0;
          electNode(context, node, restartOutputNode);
          chosen = context.get("lastElectedNode");
          output[chosen] = msg;
          node.send(output);
        }
      } else {
        for (let outputNum = -1; outputNum < numberOfOutputs; outputNum++) {
          chosen = outputNum;
          electNode(context, node, outputNum, ReElectionBan);
        }
        chosen = context.get("lastElectedNode");
        output[chosen] = msg;
        node.send(output);
      }
    });
  }

  RED.nodes.registerType("random-output-advanced", RandomOutputNode);
};
