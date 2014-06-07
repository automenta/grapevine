Telepathine for Node.JS
=======================

## Features
 * P2P "Gossip" protocol
 * Shared memory (distributed hashtable)
 * Distributed event bus
 * Incremental change-sets
 * Failure detection
 * Fault-tolerant
 * Self-managing cluster or mesh
 * TCP with optional UDP mode (connection-less for small packets)
 

## API

### Methods
    
#### start([callback]), stop()
 * start and stop the peer
	
#### set(key, value[, expiresAt]) 
 * set local key/value state, broadcasting to peers.  expiresAt is a unixtime (millisecond resolution)
	
#### get(key) 
 * get locally stored value

#### getRemote(peer, key) 
 * get remotely stored value from a specific peer
    
#### getRemoteKeys(peer)	
 * get all keys that have been provided by a particular peer

#### allPeers()
    
#### livePeers()
    
#### deadPeers()

#### say(eventname, parameter[, eventDurationMS, buffer])
 * send an event for a finite duration, which triggers receiver's 'hear' handlers	

#### hear(eventname, handler(data, fromPeer) )
 * receive 'say' events.  eventname can use EventEmitter2 wildcard

#### hearOnce(eventname, handler(data, fromPeer) )
 * receive a 'say' event once.

#### know(key, handler(peer, value))
 * receives 'set' events for a given key.  eventname can use EventEmitter2 wildcard

#### on(eventname, handler)
 * handle peer events, described below.  eventname can use EventEmitter2 wildcard



### Events

#### on('start', function(peer) {})
 * local peer started

#### on('stop', function(peer) {})
 * local peer stopped

#### on('set', function(peer_name, key, value) {})	
 * value set

#### on('set:[key]', function(peer_name, value) {})	
 * value set, allows using EventEmitter2 wildcards

#### on('say:[eventname]', function(parameter, fromPeer) {})	
 * received remote 'say' event, allows using EventEmitter2 wildcards.  a peer does not receive its own 'say' events.

#### on('key:expired', function(peer_name, key, value, ttl) {})	
 * a key has expired

#### on('peer:new', function(peerstate) {})
 * peer discovered
    
#### on('peer:start', function(peer_name) {})
 * peer seems alive
	
#### on('peer:stop', function(peer_name) {})
 * peers seems dead



## Examples

### Distributed Shared Memory 
**From: simulation/example_p2p.js**

	//For debug log, run: DEBUG=* node examples/p2p.js

	var T = require('../lib/telepathine.js').Telepathine;

	var startPort = 9000;
	var numSeeds = 4;

	var seed = new T( startPort++,
					  [ /* no seeds */ ], 
					  { /* default configuration */ } 
					).start();	

	// Create peers and point them at the seed 
	// Usually this would happen in separate processes.
	// To prevent a network's single point of failure, design with multiple seeds.
	for (var i = 0; i < numSeeds; i++) {

		var g = new T(i + startPort + 1, 
					  ['127.0.0.1:' + (startPort + i + 2)]).start();

		//event emitted when a remote peer sets a key to a value
		g.on('set', function (peer, k, v) {
			console.log(this.peer_name + " knows via on('set'.. that peer " + peer + " set " + k + "=" + v);
		});

		//convenience method for key/value change events
		g.know('somekey', function (peer, v) {
			console.log(this.peer_name + " knows via know('somekey'.. that peer " + peer + " set somekey=" + v);
		});

		//convenience method for key change events, using wildcard
		g.know('*', function (peer, v) {
			console.log(this.peer_name + " knows via know('*'.. that peer " + peer + " set " + this.event + "=" + v);
		});
	}


	// Another peer which updates state after a delay
	new T(startPort, 
		  ['127.0.0.1:' + (startPort + 1)] )
			.after(1000, function () {

				// indefinite memory
				this.set('somekey', 'somevalue');

				// temporary memory: 10 seconds from now this key will start to expire in the gossip net
				this.set('somekey2', 'somevalue', Date.now() + 10000);

			}).start();

### Distributed Event Bus
**From: simulation/example_events.js**

	var a = new T(9000, []).start();
	var b = new T(9001, [":9000"]).start();

	a.on('start', function () {

		a.hearOnce('eventname', function (data, fromPeer) {
			console.log('a received eventname=', data, 'from', fromPeer);
			a.say('reply');
		});

		a.hear('*', function (data, fromPeer) {
			console.log('a received ', this.event, '=', data, 'from', fromPeer);
		});

	});

	b.on('start', function () {

		b.hearOnce('reply', function (data, fromPeer) {
			console.log('b received reply=', data, ' from ', fromPeer);
		});		

		b.say('eventname', 'eventdata');
		
	});
	

## Tests

    expresso -I lib test/*	
	
...or:

	npm test


## Changes

This is a fork of **grapevine** which is a fork of the original **node-gossip**.

> grape·vine  (grāp′vīn′) n.
> 1. A vine on which grapes grow.
> 2.
>   a. The informal transmission of information, gossip, or rumor from person to person.
>   b. A usually unrevealed source of confidential information.

* json-over-tcp instead of msgpack
* key/value pairs have optional ttl, which propagates to the other peers, it will cause keys to get deleted (although this is not an EXACT mechanism, so it shouldn't be used as such)
* IPv6 support
* various bug fixes
* UDP messaging for high performance, used for small messages

node-gossip implements a gossip protocol w/failure detection, allowing you to create a fault-tolerant, self-managing cluster of node.js processes.  Each server in the cluster has it's own set of key-value pairs which are propogated to the others peers in the cluster.  The API allows you to make changes to the local state, listen for changes in state, listen for new peers and be notified when a peer appears to be dead or appears to have come back to life.

The module is currently in 'hey it seems to work for me' state, there are probably some bugs lurking around. The API will probably change and suggestions on how to improve it are very welcome.

See scripts in the **simulations/** directory for examples.


## TODO

* major code refactoring, too many people wrote too much code without proper coordination
* convert tests to mocha
* test edge cases
* Cluster name -- dont allow peers to accidentally join the wrong cluster
* The scuttlebutt paper mentions a couple things we don't current do:
  * congestion throttling
  * make digests only be random subsets


## References

### Gossip Protocol
Both the gossip protocol and the failure detection algorithms are based off of academic papers and Cassandra's (http://www.cassandra.org/) implementation of those papers.  This library is highly indebted to both.

* ["Efficient reconciliation and flow control for anti-entropy protocols"](http://www.cs.cornell.edu/home/rvr/papers/flowgossip.pdf)
* ["The Phi accrual failure detector"](http://vsedach.googlepages.com/HDY04.pdf)

### Scuttlebutt
* https://github.com/dominictarr/scuttlebutt
* http://awinterman.github.io/simple-scuttle/