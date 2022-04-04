module.exports = function (RED) {
  function electNode(context, node, outputNum) {
    //Check if outputNum is eligible for re-election
    if (checkReelectionEligibility(context, outputNum, node) == true) {
      context.set("lastElectedNode", outputNum);
      context.set("lastElectedTime", Date.now());
      //2m minutes to expire
      context.set("lastElectedTimeNode" + electedNode, Date.now() + 120000);
      node.log(
        "node-red-contrib: Elected node " +
          electedNode +
          " at " +
          context.get("lastElectedTime")
      );
    } else {
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

    let electedNode = context.get("lastElectedNode");
    let electedTime = context.get("lastElectedTime");

    const numberOfOutputs = config.outputs;

    node.on("input", function (msg) {
      let output = new Array(numberOfOutputs);
      let chosen;
      if (electedNode !== "" && electedNode !== undefined) {
        chosen = electedNode;
        if (electedTime > Date.now() - 30000) {
          chosen = electedNode;
          output[chosen] = msg;
          node.send(output);
        } else {
          for (let outputNum = 0; outputNum < numberOfOutputs; outputNum++) {
            chosen = outputNum;
            electNode(context, node, outputNum);
          }
          chosen = electedNode;
          output[chosen] = msg;
          node.send(output);
        }
      }
    });
  }

  RED.nodes.registerType("random-output-advanced", RandomOutputNode);
};
