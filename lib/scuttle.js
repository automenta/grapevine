var debug = require('debug')('grapevine_scuttle');
var ipcompress = require('./ip');
var PeerState = require('./peer_state').PeerState;
var Scuttle = exports.Scuttle = function(peers) {
  this.peers      = peers;
};

Scuttle.prototype.digest = function() {
  var digest = {};

  for(i in this.peers) {
    var p = this.peers[i];
    /*digest[i] = {
      maxVersionSeen: p.max_version_seen,
      metadata: p.metadata
    }*/
	
	i = ipcompress.IPStringToB64(i);
	  
	if (p.metadata)
		digest[i] = [
		  p.max_version_seen,
		  p.metadata
		];
	else
		digest[i] = p.max_version_seen;
	
  }
  return digest;
}

// HEART OF THE BEAST

Scuttle.prototype.scuttle = function(digest) {
  var deltas_with_peer  = [];
  var requests          = {};
  var new_peers         = {};

  for(var dpeer in digest) {
  
	var peer = ipcompress.IPB64ToString(dpeer);	  

	var localVersion   = this.maxVersionSeenForPeer(peer);
    var localPeer      = this.peers[peer];
    var digestVersion  = Array.isArray(digest[dpeer]) ? digest[dpeer][0] : digest[dpeer];

    if(!this.peers[peer]) {
      // We don't know about this peer. Request all information.
      requests[dpeer] = 0;
      new_peers[peer] = digest.metadata;
    } else if(localVersion > digestVersion) {
      // We have more recent information for this peer. Build up deltas.
      deltas_with_peer.push( { peer : peer, deltas :  localPeer.deltasAfterVersion(digestVersion) });
    } else if(localVersion < digestVersion) {
      // They have more recent information, request it.
      requests[dpeer] = localVersion;
    } else {
      // Everything is the same.
    }
  }

  // Sort by peers with most deltas
  deltas_with_peer.sort( function(a,b) { return b.deltas.length - a.deltas.length } );

  var deltas = [];
  for(var i = 0; i < deltas_with_peer.length; i++) {
    var peer = deltas_with_peer[i];
    var peer_deltas = peer.deltas;

    // Sort deltas by version number
    peer_deltas.sort(function(a,b) { return a[2] - b[2]; });

    if(peer_deltas.length > 1) {
      if (debug.enabled) debug(peer_deltas);
    }

    //TODO: possible optimization: dont use unshift
    for(var j = 0; j < peer_deltas.length; j++) {
      var delta = peer_deltas[j];
      delta.unshift(ipcompress.IPStringToB64( peer.peer ));
      deltas.push(delta);
    }
  }

  return {  'deltas' : deltas,
            'requests' : requests,
            'new_peers' : new_peers };
}

Scuttle.prototype.maxVersionSeenForPeer = function(peer) {
  if(this.peers[peer]) {
    return this.peers[peer].max_version_seen;
  } else {
    return 0;
  }
}

Scuttle.prototype.updateKnownState = function(deltas) {
  var now = Date.now();
  for(i in deltas) {
    var d = deltas[i];
    try {
		var peer_name  = ipcompress.IPB64ToString( d.shift() );
		var peer_state = this.peers[peer_name];
		peer_state.updateWithDelta(d[0],d[1],d[2],d[3],now);
    }
	catch (e) {
		if (debug.enabled) debug('Scuttle.updateKnownState: ' + e);
	}
  }
};

Scuttle.prototype.fetchDeltas = function(requests) {  
  var deltas = [];
  if (!requests) return deltas;

  for(di in requests) {
	var i = ipcompress.IPB64ToString(di);
    var peer_deltas = this.peers[i].deltasAfterVersion(requests[di]);
    peer_deltas.sort(function(a,b) { return a[2] - b[2]; });
    for(var j = 0; j < peer_deltas.length; j++) {
      peer_deltas[j].unshift(i);
      deltas.push(peer_deltas[j]);
    }
  }
  return deltas;
}
