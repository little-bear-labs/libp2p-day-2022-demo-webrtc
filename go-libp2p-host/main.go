package main

import (
	"bufio"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/libp2p/go-libp2p"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	webrtc "github.com/libp2p/go-libp2p/p2p/transport/webrtc"
)

var listenerIp = net.IPv4(0, 0, 0, 0)

func init() {
	ifaces, err := net.Interfaces()
	if err != nil {
		return
	}
	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			return
		}
		for _, addr := range addrs {
			// bind to private non-loopback ip
			if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() && ipnet.IP.IsPrivate() {
				if ipnet.IP.To4() != nil {
					listenerIp = ipnet.IP.To4()
					return
				}
			}
		}
	}
}

func echoHandler(stream network.Stream) {
	for {
		reader := bufio.NewReader(stream)
		str, err := reader.ReadString('\n')
		log.Printf("err: %s", err)
		if err != nil {
			return
		}
		log.Printf("echo: %s", str)
		_, err = stream.Write([]byte(str))
		log.Printf("err: %s", err)
		if err != nil {
			return
		}

	}
}

func main() {
	host := createHost()
	host.SetStreamHandler("/echo/1.0.0", echoHandler)
	defer host.Close()
	remoteInfo := peer.AddrInfo{
		ID:    host.ID(),
		Addrs: host.Network().ListenAddresses(),
	}

	remoteAddrs, _ := peer.AddrInfoToP2pAddrs(&remoteInfo)
	fmt.Println("p2p addr: ", remoteAddrs[0])

	fmt.Println("press Ctrl+C to quit")
	ch := make(chan os.Signal, 1)
	signal.Notify(ch, syscall.SIGTERM, syscall.SIGINT)
	<-ch
}

func createHost() host.Host {
	h, err := libp2p.New(
		libp2p.Transport(webrtc.New),
		libp2p.ListenAddrStrings(
			fmt.Sprintf("/ip4/%s/udp/0/webrtc", listenerIp),
		),
		libp2p.DisableRelay(),
		libp2p.Ping(true),
	)
	if err != nil {
		panic(err)
	}

	return h
}

// func dialHost(ctx context.Context, server host.Host) {
// 	client, err := libp2p.New(
// 		libp2p.Transport(webrtc.New),
// 		libp2p.DisableRelay(),
// 		libp2p.Ping(true),
// 	)
// 	if err != nil {
// 		panic(err)
// 	}

// 	if err = server.ID().Validate(); err != nil {
// 		panic(err)
// 	}

// 	remoteInfo := peer.AddrInfo{
// 		ID:    server.ID(),
// 		Addrs: server.Network().ListenAddresses(),
// 	}

// 	remoteAddrs, err := peer.AddrInfoToP2pAddrs(&remoteInfo)
// 	fmt.Println("p2p addr: ", remoteAddrs)

// 	fmt.Println("=========================== connecting ==============================")
// 	err = client.Connect(context.Background(), remoteInfo)
// 	if err != nil {
// 		panic(err)
// 	}
// 	fmt.Println("============================ connected ==============================")

// 	resultChan := ping.Ping(ctx, server, server.ID())

// 	for i := 0; i < 5; i++ {
// 		select {
// 		case <-ctx.Done():
// 		case result := <-resultChan:
// 			if result.Error != nil {
// 				fmt.Println("ping error", result.Error)
// 			} else {
// 				fmt.Println("pinged", remoteInfo.Addrs, " in ", result.RTT)
// 			}
// 		}

// 	}

// }
