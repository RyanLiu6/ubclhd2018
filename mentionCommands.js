// Utils library
const Utils = require("./utils");

// Apollo Prefixes
const PREFIX_SUGGEST = "suggest";
const PREFIX_CHECK = "check";
const PREFIX_ADDRESS = "address";

exports.commandParser = function(client) {
  switch (client.command) {
    case PREFIX_SUGGEST:
      commandSuggest(client);
      break;
    case PREFIX_CHECK:
      commandCheck(client);
      break;
    case PREFIX_ADDRESS:
      commandAddress(client);
      break;
    default:
      console.log("uh-oh");
      Utils.sendToChannel(client, "Uh-oh. I didn't understand that - could you try again?\n");
  };
}

function commandSuggest(client) {
  var index = client.arg.indexOf(PREFIX_SUGGEST);

  // Check if there are enough arguments.
  // If not, alert user
  if (client.arg.length <= index + 2) {
    console.log("wtf");

    client.chat.postMessage({
      channel: client.retChannel,
      text: `<@${client.retUser}> - your suggest request was malformed. Please try again.`
    })
    .catch(console.error);
  } else {
    // Call external module
    Utils.suggest(client.arg[index + 1], client.arg[index + 2], client);
  }
};

function commandCheck(client) {
  var index = client.arg.indexOf(PREFIX_CHECK);

  // Call external module
  Utils.check(client.arg.slice(index + 1).join(" ").toLowerCase(), client);
};

function commandAddress(client) {
  var index = client.arg.indexOf(PREFIX_ADDRESS);
  console.log(client.arg);

  // Call external module
  Utils.address(client.arg.slice(index + 1).join(" "), client);
}
