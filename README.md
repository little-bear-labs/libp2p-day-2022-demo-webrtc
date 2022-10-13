# Overview

This repo contains demo code for LibP2P Day 2022. The goal is to demonstrate interopability between the
Go and Javascript implementations of Libp2p using the WebRTC transport.

## Contents


## Instructions

### Running Go host:
```
    $ cd go-libp2p-host
    $ go build
    $ ./go-libp2p-host
```
The output of `go-libp2p-host` should be something like:
    
    p2p addr:  /ip4/172.29.128.142/udp/62499/webrtc/certhash/uEiBec5Z32kurAEP29bQ-B20RdhokNzjujfwBh79xh0b6mw/p2p/12D3KooWH3sWbHfTsqHMpV1zWAB2me2H4yXABwxRCupLNwkSfsgD
    press Ctrl+C to quit

Copy the multiaddr following _p2p addr:_

### Running Javascript client