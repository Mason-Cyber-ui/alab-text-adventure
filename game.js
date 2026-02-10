// Import required standard module
const readline = require("readline");
const fs = require("fs");
const path = require("path");

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
  level: 1,
  experience: 0,
  health: 100,
  puzzlesSolved: [],
  saveSlot: null,
};

// Game map
const gameMap = {
  start: {
    description:
      "You are in a dark, cold room with three doors. One leads to the north, another to the east, and a third to the west.",
    directions: {
      north: "library",
      east: "kitchen",
      west: "combatRoom",
    },
  },
  library: {
    description:
      "You find yourself surrounded by shelves of ancient books. There is a door to the south and a mysterious passage to the north.",
    directions: {
      south: "start",
      north: "puzzleRoom",
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
  puzzleRoom: {
    description:
      "A mysterious room with ancient runes on the walls. A riddle is carved into the stone floor.",
    directions: {
      south: "library",
    },
    puzzle: {
      question: "I have cities, but no houses live there. I have mountains, but no trees. I have water, but no fish. What am I?",
      answer: "map",
      reward: { experience: 50, item: "magic crystal" }
    }
  },
  combatRoom: {
    description:
      "A dark chamber where a shadowy figure blocks your path. It seems hostile.",
    directions: {
      east: "start",
    },
    enemy: {
      name: "Shadow Guardian",
      health: 50,
      damage: 15,
      reward: { experience: 75, item: "guardian's sword" }
    }
  },
};

// Function to show current location
function showLocation() {
  const location = gameMap[gameState.currentRoom];
  console.log("\n" + "=".repeat(50));
  console.log(location.description);
  
  // Show player stats
  console.log(`\n📊 Level: ${gameState.level} | ❤️  Health: ${gameState.health} | ⭐ XP: ${gameState.experience}`);
  
  // Show available directions
  const directions = Object.keys(location.directions);
  if (directions.length > 0) {
    console.log(`You can go: ${directions.join(", ")}`);
  }
  
  // Show items in room
  if (location.item && !location.itemTaken) {
    console.log(`You see a ${location.item} here.`);
  }
  
  // Show puzzle in room
  if (location.puzzle && !gameState.puzzlesSolved.includes(gameState.currentRoom)) {
    console.log("There's a puzzle here. Type 'solve' to attempt it.");
  }
  
  // Show enemy in room
  if (location.enemy && !location.enemy.defeated) {
    console.log(`⚔️  A ${location.enemy.name} blocks your path!`);
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

// Function to save game
function saveGame(slot = 1) {
  try {
    const saveData = {
      ...gameState,
      timestamp: new Date().toISOString(),
      saveSlot: slot
    };
    
    const filename = `save_slot_${slot}.json`;
    fs.writeFileSync(filename, JSON.stringify(saveData, null, 2));
    console.log(`✅ Game saved to slot ${slot}!`);
  } catch (error) {
    console.log("❌ Failed to save game:", error.message);
  }
}

// Function to load game
function loadGame(slot = 1) {
  try {
    const filename = `save_slot_${slot}.json`;
    if (!fs.existsSync(filename)) {
      console.log(`❌ No save file found in slot ${slot}.`);
      return false;
    }
    
    const saveData = JSON.parse(fs.readFileSync(filename, 'utf8'));
    gameState = { ...saveData };
    console.log(`✅ Game loaded from slot ${slot}!`);
    showLocation();
    return true;
  } catch (error) {
    console.log("❌ Failed to load game:", error.message);
    return false;
  }
}

// Function to gain experience and level up
function gainExperience(amount) {
  gameState.experience += amount;
  console.log(`⭐ +${amount} XP gained!`);
  
  const xpForNextLevel = gameState.level * 100;
  if (gameState.experience >= xpForNextLevel) {
    gameState.level++;
    gameState.experience -= xpForNextLevel;
    gameState.health = Math.min(gameState.health + 20, 100 + (gameState.level - 1) * 10);
    console.log(`🎉 LEVEL UP! You are now level ${gameState.level}!`);
    console.log(`❤️  Health restored to ${gameState.health}!`);
  }
}

// Function to handle combat
function startCombat() {
  const location = gameMap[gameState.currentRoom];
  if (!location.enemy || location.enemy.defeated) {
    console.log("There's no enemy here to fight.");
    return;
  }
  
  const enemy = { ...location.enemy };
  console.log(`⚔️  Combat started with ${enemy.name}!`);
  console.log(`Enemy Health: ${enemy.health} | Your Health: ${gameState.health}`);
  
  const combatRound = () => {
    if (enemy.health <= 0) {
      console.log(`🎉 You defeated the ${enemy.name}!`);
      gainExperience(enemy.reward.experience);
      if (enemy.reward.item) {
        gameState.inventory.push(enemy.reward.item);
        console.log(`📦 You found a ${enemy.reward.item}!`);
      }
      location.enemy.defeated = true;
      showLocation();
      return;
    }
    
    if (gameState.health <= 0) {
      console.log(`💀 You were defeated by the ${enemy.name}!`);
      console.log("Game Over! Type 'restart' to try again.");
      gameState.gameActive = false;
      return;
    }
    
    rl.question("Choose your action: (1) Attack (2) Run away > ", (choice) => {
      if (choice === "1") {
        const playerDamage = Math.floor(Math.random() * 20) + 10 + gameState.level * 2;
        enemy.health -= playerDamage;
        console.log(`⚔️  You deal ${playerDamage} damage to ${enemy.name}!`);
        
        if (enemy.health > 0) {
          const enemyDamage = Math.floor(Math.random() * enemy.damage) + 5;
          gameState.health -= enemyDamage;
          console.log(`💔 ${enemy.name} deals ${enemyDamage} damage to you!`);
        }
        
        console.log(`Enemy Health: ${Math.max(0, enemy.health)} | Your Health: ${Math.max(0, gameState.health)}`);
      } else if (choice === "2") {
        console.log("🏃 You run away from combat!");
        showLocation();
        return;
      } else {
        console.log("Invalid choice! You hesitate...");
        const enemyDamage = Math.floor(Math.random() * enemy.damage) + 5;
        gameState.health -= enemyDamage;
        console.log(`💔 ${enemy.name} deals ${enemyDamage} damage while you hesitate!`);
      }
      
      if (gameState.gameActive) {
        combatRound();
      }
    });
  };
  
  combatRound();
}

// Function to solve puzzles
function solvePuzzle() {
  const location = gameMap[gameState.currentRoom];
  if (!location.puzzle || gameState.puzzlesSolved.includes(gameState.currentRoom)) {
    console.log("There's no puzzle here to solve.");
    return;
  }
  
  console.log("🧩 Puzzle:");
  console.log(location.puzzle.question);
  
  rl.question("Your answer > ", (answer) => {
    if (answer.toLowerCase().trim() === location.puzzle.answer.toLowerCase()) {
      console.log("✅ Correct! You solved the puzzle!");
      gameState.puzzlesSolved.push(gameState.currentRoom);
      gainExperience(location.puzzle.reward.experience);
      
      if (location.puzzle.reward.item) {
        gameState.inventory.push(location.puzzle.reward.item);
        console.log(`📦 You received a ${location.puzzle.reward.item}!`);
      }
    } else {
      console.log("❌ Wrong answer. Try again later!");
      gameState.health = Math.max(0, gameState.health - 10);
      console.log(`💔 You lose 10 health for the failed attempt. Health: ${gameState.health}`);
    }
    showLocation();
  });
}
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
  console.log("\n🎮 Available commands:");
  console.log("📍 Movement: north, south, east, west, portal");
  console.log("🔧 Actions: take, inventory, help, look, quit");
  console.log("💾 Save/Load: save [1-3], load [1-3]");
  console.log("⚔️  Combat: fight (when enemy present)");
  console.log("🧩 Puzzles: solve (when puzzle present)");
  console.log("🎯 Special: use [item] (e.g., 'use rusty key' in secret room)");
  console.log("🔄 restart: Start a new game");
  console.log("\n📊 Game Features:");
  console.log("- Level up system with experience points");
  console.log("- Combat with enemies");
  console.log("- Puzzle solving");
  console.log("- Save/load game progress");
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
  
  // Handle restart command
  if (command === "restart") {
    gameState = {
      currentRoom: "start",
      inventory: [],
      gameActive: true,
      gameWon: false,
      level: 1,
      experience: 0,
      health: 100,
      puzzlesSolved: [],
      saveSlot: null,
    };
    // Reset game map items and enemies
    Object.keys(gameMap).forEach(room => {
      if (gameMap[room].itemTaken) delete gameMap[room].itemTaken;
      if (gameMap[room].enemy && gameMap[room].enemy.defeated) delete gameMap[room].enemy.defeated;
    });
    console.log("🔄 Game restarted! Good luck!");
    showLocation();
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
  
  // Handle fight command
  if (command === "fight" || command === "attack") {
    startCombat();
    return;
  }
  
  // Handle solve command
  if (command === "solve") {
    solvePuzzle();
    return;
  }
  
  // Handle save command
  if (command.startsWith("save")) {
    const parts = command.split(" ");
    const slot = parts[1] ? parseInt(parts[1]) : 1;
    if (slot >= 1 && slot <= 3) {
      saveGame(slot);
    } else {
      console.log("❌ Please specify a save slot between 1 and 3.");
    }
    return;
  }
  
  // Handle load command
  if (command.startsWith("load")) {
    const parts = command.split(" ");
    const slot = parts[1] ? parseInt(parts[1]) : 1;
    if (slot >= 1 && slot <= 3) {
      loadGame(slot);
    } else {
      console.log("❌ Please specify a load slot between 1 and 3.");
    }
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
    // Check if enemy blocks the path
    if (currentLocation.enemy && !currentLocation.enemy.defeated && command !== "east") {
      console.log(`⚔️  The ${currentLocation.enemy.name} blocks your path! You must defeat it first.`);
      return;
    }
    moveToNewLocation(command);
    return;
  }
  
  console.log("❌ Invalid command. Type 'help' for available commands.");
}

// Function to start the game
function startGame() {
  console.log("🏰 Welcome to the Enhanced Text Adventure Game! 🏰");
  console.log("🎯 Your goal: Find the rusty key, unlock the secret room, and claim the treasure!");
  console.log("⚔️  Battle enemies, solve puzzles, and level up along the way!");
  console.log("💾 Don't forget to save your progress!");
  console.log("Type 'help' at any time to see all commands.");
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
