module.exports = function (RED) {
  function electNode(context, node, outputNum) {
    //Check if outputNum is eligible for re-election
    node.log(
      "Checking if output " + outputNum + " is eligible for re-election"
    );
    if (checkReelectionEligibility(context, outputNum, node) == true) {
      context.set("lastElectedNode", outputNum);
      context.set("lastElectedTime", Date.now());
      //2m minutes to expire
      context.set(
        "lastElectedTimeNode" + context.get("lastElectedNode"),
        Date.now() + 60000
      );
      node.log(
        "node-red-contrib: Elected node " +
          context.get("lastElectedNode") +
          " at " +
          context.get("lastElectedTime")
      );
    } else {
      node.log(outputNum + " is not eligible for re-election");
      return false;
    }
  }
  function checkReelectionEligibility(context, outputNum, node) {
    context.get("lastElectedTimeNode" + outputNum);
    //check if the node is eligible for re-election
    if (context.get("lastElectedTimeNode" + outputNum) > Date.now()) {
      node.log(
        "node-red-contrib: Node " +
          outputNum +
          " is not eligible for re-election"
      );
      electNode(context, node, outputNum++);
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

    const numberOfOutputs = config.outputs;

    node.on("input", function (msg) {
      node.log("node-red-contrib: Random Output Node created");
      node.log("node-red-contrib: Number of outputs: " + numberOfOutputs);
      if (context.get("lastElectedNode") !== undefined) {
        node.log(
          "node-red-contrib: Currently elected node: " +
            context.get("lastElectedNode")
        );
        node.log(
          "node-red-contrib: Last elected time: " +
            context.get("lastElectedTime")
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
          context.get("lastElectedTime") > Date.now() - 30000 &&
          context.get("lastElectedTime") !== undefined
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
          electNode(context, node, outputNum);
        }
        chosen = context.get("lastElectedNode");
        output[chosen] = msg;
        node.send(output);
      }
    });
  }

  RED.nodes.registerType("random-output-advanced", RandomOutputNode);
};
