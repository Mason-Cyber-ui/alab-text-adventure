// Import required standard module
const readline = require("readline");

// Create readline interface for input/output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Game state
let gameState = {
  currentRoom: "start",
  inventory: [],
  gameActive: true,
  gameWon: false,
};

// Game map
const gameMap = {
  start: {
    description:
      "You are in a dark, cold room with two doors. One leads to the north and another to the east.",
    directions: {
      north: "library",
      east: "kitchen",
    },
  },
  library: {
    description:
      "You find yourself surrounded by shelves of ancient books. There is a door to the south.",
    directions: {
      south: "start",
    },
    item: "ancient book",
  },
  kitchen: {
    description:
      "A seemingly abandoned kitchen. There's a door to the west and a strange, glowing portal that seems to lead nowhere.",
    directions: {
      west: "start",
      portal: "secretRoom",
    },
    item: "rusty key",
  },
  secretRoom: {
    description:
      "You step through the portal and enter a secret room filled with treasure. A golden chest sits in the center, waiting to be opened.",
    directions: {
      portal: "kitchen",
    },
    requiresKey: true,
  },
};

// Function to show current location
function showLocation() {
  const location = gameMap[gameState.currentRoom];
  console.log("\n" + "=".repeat(50));
  console.log(location.description);
  
  // Show available directions
  const directions = Object.keys(location.directions);
  if (directions.length > 0) {
    console.log(`You can go: ${directions.join(", ")}`);
  }
  
  // Show items in room
  if (location.item && !location.itemTaken) {
    console.log(`You see a ${location.item} here.`);
  }
  
  // Show special room requirements
  if (location.requiresKey && !gameState.inventory.includes("rusty key")) {
    console.log("The chest is locked. You need a rusty key to open it.");
  }
}

// Function to move to a new location
function moveToNewLocation(direction) {
  const currentLocation = gameMap[gameState.currentRoom];
  
  if (currentLocation.directions[direction]) {
    // Check if trying to enter secret room without key
    const targetRoom = currentLocation.directions[direction];
    if (targetRoom === "secretRoom" && !gameState.inventory.includes("rusty key")) {
      console.log("The portal is sealed. You need a rusty key to activate it.");
      return;
    }
    
    gameState.currentRoom = targetRoom;
    showLocation();
  } else {
    console.log("You can't go that way.");
  }
}

// Function to pick up items
function pickUpItem() {
  const location = gameMap[gameState.currentRoom];
  
  if (location.item && !location.itemTaken) {
    gameState.inventory.push(location.item);
    location.itemTaken = true;
    console.log(`You picked up the ${location.item}.`);
  } else {
    console.log("There's nothing to pick up here.");
  }
}

// Function to show inventory
function showInventory() {
  if (gameState.inventory.length === 0) {
    console.log("Your inventory is empty.");
  } else {
    console.log(`You are carrying: ${gameState.inventory.join(", ")}`);
  }
}

// Function to show help
function showHelp() {
  console.log("\nAvailable commands:");
  console.log("- Movement: north, south, east, west, portal");
  console.log("- Actions: take, inventory, help, look, quit");
  console.log("- Special: use [item] (e.g., 'use rusty key' in secret room)");
}

// Function to look around (re-show current location)
function lookAround() {
  showLocation();
}

// Function to use items
function useItem(itemName) {
  if (!gameState.inventory.includes(itemName)) {
    console.log(`You don't have a ${itemName}.`);
    return;
  }
  
  if (gameState.currentRoom === "secretRoom" && itemName === "rusty key") {
    console.log("You use the rusty key to open the golden chest!");
    console.log("Inside, you find ancient artifacts and endless riches!");
    console.log("🎉 CONGRATULATIONS! You've won the game! 🎉");
    gameState.gameWon = true;
    gameState.gameActive = false;
    rl.close();
  } else {
    console.log(`You can't use the ${itemName} here.`);
  }
}

// Function to process commands
function processCommand(input) {
  const command = input.toLowerCase().trim();
  
  // Handle quit command
  if (command === "quit") {
    gameState.gameActive = false;
    rl.close();
    return;
  }
  
  // Handle help command
  if (command === "help") {
    showHelp();
    return;
  }
  
  // Handle inventory command
  if (command === "inventory" || command === "i") {
    showInventory();
    return;
  }
  
  // Handle look command
  if (command === "look" || command === "l") {
    lookAround();
    return;
  }
  
  // Handle take command
  if (command === "take" || command === "get") {
    pickUpItem();
    return;
  }
  
  // Handle use command
  if (command.startsWith("use ")) {
    const itemName = command.substring(4).trim();
    useItem(itemName);
    return;
  }
  
  // Handle movement commands
  const currentLocation = gameMap[gameState.currentRoom];
  if (command in currentLocation.directions) {
    moveToNewLocation(command);
    return;
  }
  
  console.log("Invalid command. Type 'help' for available commands.");
}

// Function to start the game
function startGame() {
  console.log("🏰 Welcome to the Text Adventure Game! 🏰");
  console.log("Your goal is to find the treasure in the secret room.");
  console.log("Type 'help' at any time to see available commands.");
  console.log("Type 'quit' to exit the game.\n");
  
  showLocation();
  
  rl.on("line", (input) => {
    if (gameState.gameActive) {
      processCommand(input);
    }
  });
  
  rl.on("close", () => {
    if (gameState.gameWon) {
      console.log("\nThanks for playing! You emerged victorious!");
    } else {
      console.log("\nThanks for playing! Goodbye!");
    }
  });
}

// Initiate the game
startGame();
