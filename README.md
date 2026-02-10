# Text Adventure Game

A Node.js-based text adventure game where players explore rooms, collect items, and solve puzzles to find treasure.

## How to Run

```bash
node game.js
```

## Game Objective

Find the rusty key in the kitchen, use it to unlock the portal to the secret room, and open the treasure chest to win!

## Commands

- **Movement**: `north`, `south`, `east`, `west`, `portal`
- **Actions**: `take` (or `get`), `inventory` (or `i`), `help`, `look` (or `l`), `quit`
- **Special**: `use [item]` (e.g., `use rusty key`)

## Game Map

1. **Start Room** - Dark room with doors north and east
2. **Library** - Contains an ancient book (south to start)
3. **Kitchen** - Contains the rusty key (west to start, portal to secret room)
4. **Secret Room** - Contains the treasure chest (requires rusty key)

## Features Implemented

✅ Item pickup functionality  
✅ Inventory management  
✅ Help command  
✅ Victory condition  
✅ Enhanced UI with better descriptions  
✅ Command validation and error handling  

## Future Enhancements

- Game-saving functionality
- Combat system
- Leveling system
- More rooms and puzzles
