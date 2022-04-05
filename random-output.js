module.exports = function (RED) {
  function checkReelectionEligibility(context, outputNum, node) {
    //check if the node is eligible for re-election
    if (context.get("ElectionBannedUntill" + outputNum) > Date.now()) {
      return false;
    } else {
      return true;
    }
  }
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
      //2m minutes to expire
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
    } else {
      node.log(
        "node-red-contrib: Node " +
          outputNum +
          " will be eligable at: " +
          context.get("lastElectedTime" + outputNum)
      );
      node.log(
        "node-red-contrib: " + outputNum + " is not eligible for re-election"
      );
      return false;
    }
  }

  function RandomOutputNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let context = this.context();

    const ReElectionBan = 360000; //360 seconds
    const ElectionTime = 15000; //15 seconds

    const numberOfOutputs = config.outputs - 1;

    node.on("input", function (msg) {
      node.log("------------------------------------------------------");
      node.log("node-red-contrib: Random Output Node created");
      node.log("node-red-contrib: Number of outputs: " + (numberOfOutputs + 1));

      let output = new Array(numberOfOutputs);
      let chosen = 0;
      //Check if there is an elected node
      if (context.get("lastElectedNode") !== undefined) {
        node.log(
          "node-red-contrib: Elected node: " + context.get("lastElectedNode")
        );
        }
        else {
        node.log("node-red-contrib: No elected node");
        //Elect the first node
        electNode(context, node, 0, ReElectionBan);
      }

        chosen = context.get("lastElectedNode");
        output[chosen] = msg;
        node.send(output);
      });
  }

  RED.nodes.registerType("random-output-advanced", RandomOutputNode);
};
