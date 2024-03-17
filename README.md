# simple-store
A simple server to just store arbitrary data.

Simple Store aims to fill a gap in smarthome architectures like HomeKit where the concept of global variables or data being passed between various automations and Shortcuts does not exist, but the ability to make HTTP requests does.

## How It Works
Run Simple Store locally on your network and you'll be provided with a somewhat RESTful API to store data of pretty much any kind in a database. Use it to store timestamps of when automations trigger, keep track of device states without using Dummy Switches, keep track of a device's state before an automation triggers to reset it back to that state when it's manually triggered.

## Installation and Running
Clone the repo and run `npm install`

Run the server with `npm start`

By default, the server runs on port `32323` but if you want to change that, simply set the environment variable `SIMPLE_PORT` to whatever available port you want.

## Endpoints
General note: all values are stored as strings.

### Saving Data
**Endpoint:** `/set/:key`
**Method:** POST
**Response:** SET some_var TO "a value"
Use this to set a single variable's value. Provide the variable name as the `key` param in the URL and the value as the raw, plain text POST body.

