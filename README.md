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
**Endpoint:** `/set/:key` (e.g.: /set/my_var)
**Method:** POST
**Response:** SET some_var TO "a value"
Use this to set a single variable's value. Provide the variable name as the `key` param in the URL. This endpoint accepts three different POST body types.

1. JSON String such as `{"value": 1234}` with a `Content-Type: application/json` header
2. Form Body such as `value=1234` with a `Content-Type: application/x-www-form-urlencoded` header
3. Plain text of the desired value

For JSON and form bodies, the attribute in the body MUST be `value`

---

**Endpoint:** `/set/?:key=:value` (e.g. /set?my_var=1234)
**Method:** POST
**Response:** SET my_var TO "1234"
Use this to set one or more variables. Useful for platforms that won't let you set a POST body. Provide the variable name as a querystring parameter in the URL. You can provide as many key/value pairs in the URL (separated by a `&` as will fit in the URL)


### Getting Data
**Endpoint:** `/get/:key` (e.g. /get/my_var)\
**Method:** GET\
**Response:** Plain text value of the key. If key has not yet been set, then an empty response is returned.

If you do not want an empty response returned in the event that the key has not yet been set, you can provide a `?default=` query parameter to the URL to return a default value if no data is stored for that key.

For example, calling `/get/some_unset_var?default=foo` would return `foo` as the response body if `some_unset_var` had not yet been set, otherwise, the stored value for `some_unset_var` would be returned.

---

**Endpoint:** `/get/?:key,:key,...:key` (e.g. /get?my_var,thing,stuff)
**Method:** GET
**Response:** A plain text comma-separated list of values for each key in order. If a key has not been set, `UNDEFINED` will be returned for that key. 

For example, calling `/get?my_var,some_unset_var,stuff` might return `1234,UNDEFINED,things`

---

**Endpoint:** `/get/json/?:key,:key,...:key` (e.g. /get/json/?my_var,thing,stuff)
**Method:** GET
**Response:** A JSON string containing key/value pairs for all keys found and set in the database.

If a key has not yet been set, it is omitted from the JSON response. This deviates from above since a missing JSON key means it is undefined anyway.

### Removing Data

**Endpoint:** `/delete/:key` (e.g. /delete/my_var)
**Method:** POST
**Response:** `DELETED my_var`

This method is not truly restful as it should use the DELETE HTTP verb, however, not all platforms support verbs outside of GET and POST, so this exists for wider compatibility.

---

**Endpoint:** `/set/:key` (e.g. /set/my_var)
**Method:** DELETE
**Response:** `DELETED my_var`

If you prefer a more RESTful endpoint, this alias also exists.