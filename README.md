# Buccaneer
Buccaneer is a 3D HMTL5 adaptation of the 1958 board game of the same name.

## Contributing
If you would like to contribute to this project, please use the following recommended development setup:
 - Ensure NPM is installed (either directly or using a [Node.js installer](https://nodejs.org/en/download/)).
 - Clone this repository into a suitable working directory.
 - Install the project dependencies by running `npm install` within the working directory.

To launch/debug the project, launch the Webpack development server using `npm start`.

## Features
The game is still in its alpha, and the following milestones must be met before release:
 - Complete set of GUIs for port trading and treasure reception.
 - Multiplayer support using [Socket.IO](https://Socket.IO)
 - Project restructure to support [Express](https://expressjs.com/) development, [SASS](https://sass-lang.com/) and Hot Module Replacement to accelerate development.

We have many planned features before the first release of Buccaneer. To see a full list of these features and to view the progress of this project's first release, [visit our Trello board](https://trello.com/b/dKwjZkLM/buccaneer).

## Project Structure
```bash
    .
    ├── config                  # Webpack configuration files
    ├── dist                    # Compiled distribution of the server and client
    ├── docs                    # Documentation files
    ├── src
    │   ├── client              # Client/front-end source code and assets
    │   │   ├── assets          # All game assets, including 3D models, audio and images/textures.
    │   │   ├── blender
    │   │   ├── html
    │   │   ├── style
    │   │   └── ts
    │   └── server              # Server source code
    ├── .babelrc                # Babel configuration
    ├── .prettierrc             # Configuration for the Prettier formatter 
    ├── package.json
    ├── README.md
    ├── tsconfig.json           # Typescript configuration
    └── yarn.lock
```
    

## Screenshots
### Game view with full heads-up display (HUD) visible
![](/docs/screenshot1.jpg?raw=true)

### Port trading UI
![](/docs/screenshot2.jpg?raw=true)