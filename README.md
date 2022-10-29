# Overview

This repo contains demo code for LibP2P Day 2022. The goal is to demonstrate interopability between the
Go and Javascript implementations of Libp2p using the WebRTC transport.

## Contents

- ./go-libp2p-host/

Example of a Go p2p listener using the WebRTC transport.

- ./p2p-react/

Example of a React web app with a p2p dialer using the WebRTC transport.
## Instructions

### Running Go listener service:
1. Build and run the service
```
    $ cd go-libp2p-host
    $ go build
    $ ./go-libp2p-host
```

2. Collect the service's multiaddr
The output of `go-libp2p-host` should be something like:
    
    p2p addr:  /ip4/172.29.128.142/udp/62499/webrtc/certhash/uEiBec5Z32kurAEP29bQ-B20RdhokNzjujfwBh79xh0b6mw/p2p/12D3KooWH3sWbHfTsqHMpV1zWAB2me2H4yXABwxRCupLNwkSfsgD
    press Ctrl+C to quit

Copy the multiaddr following _p2p addr:_

### Running the react dialier app:
1. Build and run the app
```
    $ cd p2p-react
    $ npm run build
    $ npm start
```

2. Open a web browser and navigate to `http://localhost:3000`
3. Paste the multiaddr from the Go listener into the _Peer MultiAddress_ form and click the _Dial_ button.