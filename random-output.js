module.exports = function (RED) {
  function electNode(context, node, outputNum, ReElectionBan) {
    if (checkReelectionEligibility(context, outputNum)) {
      context.set("lastElectedNode", outputNum);
      context.set("lastElectedTime" + outputNum, Date.now());
      context.set("ElectionBannedUntill" + outputNum, Date.now() + ReElectionBan);
      node.log(`node-red-contrib: Node ${outputNum} is eligible for re-election`);
      return true;
    } else {
      node.log(`node-red-contrib: Node ${outputNum} will be eligible at: ${context.get("ElectionBannedUntill" + outputNum)}`);
      node.log(`node-red-contrib: ${outputNum} is not eligible for re-election`);
      return false;
    }
  }

  function checkReelectionEligibility(context, outputNum) {
    return context.get("ElectionBannedUntill" + outputNum) <= Date.now();
  }

  function RandomOutputNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const context = this.context();

    const ReElectionBan = parseInt(config.reelectionBan, 10) || (4 * 60 * 60 * 1000); // 4 hours
    const ElectionTime = parseInt(config.electionTime, 10) || 2500; // 2.5 seconds
    const numberOfOutputs = parseInt(config.outputs, 10) - 1;

    if (isNaN(numberOfOutputs) || numberOfOutputs < 0) {
      node.error("Invalid number of outputs provided");
      return;
    }

    node.on("input", function (msg) {
      try {
        const lastElectedNode = context.get("lastElectedNode");
        let output = Array(numberOfOutputs).fill(null);
        let chosen;

        if (lastElectedNode !== undefined && lastElectedNode !== "") {
          chosen = lastElectedNode;
          if (context.get("lastElectedTime" + chosen) > Date.now() - ElectionTime) {
            output[chosen] = msg;
            node.send(output);
          } else {
            const nextNode = (chosen + 1) % (numberOfOutputs + 1);
            electNode(context, node, nextNode, ReElectionBan) && node.send(output);
          }
        } else {
          for (let outputNum = 0; outputNum <= numberOfOutputs; outputNum++) {
            if (electNode(context, node, outputNum, ReElectionBan)) {
              chosen = context.get("lastElectedNode");
              output[chosen] = msg;
              node.send(output);
              break;
            }
          }
        }
      } catch (error) {
        node.error(`Unexpected error occurred: ${error.message}`);
      }
    });
  }
  RED.nodes.registerType("random-output-advanced", RandomOutputNode);
};
