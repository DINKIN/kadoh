/*!
  * klass: a classical JS OOP façade
  * https://github.com/ded/klass
  * http://www.dustindiaz.com/klass
  *
  * License MIT (c) Dustin Diaz & Jacob Thornton
  */
(function(exports){

  var KadOH = exports;
  KadOH.core = {};

  KadOH.core.Class  = function () {
    var context = this
      , old = context.klass
      , f = 'function'
      , fnTest = /xyz/.test(function () {xyz}) ? /\bsupr\b/ : /.*/
      , proto = 'prototype'

    function klass(o) {
      return extend.call(isFn(o) ? o : function () {}, o, 1)
    }

    function isFn(o) {
      return typeof o === f
    }

    function wrap(k, fn, supr) {
      return function () {
        var tmp = this.supr
        this.supr = supr[proto][k]
        var ret = fn.apply(this, arguments)
        this.supr = tmp
        return ret
      }
    }

    function process(what, o, supr) {
      for (var k in o) {
        if (o.hasOwnProperty(k)) {
          what[k] = isFn(o[k])
            && isFn(supr[proto][k])
            && fnTest.test(o[k])
            ? wrap(k, o[k], supr) : o[k]
        }
      }
    }

    function extend(o, fromSub) {
      // must redefine noop each time so it doesn't inherit from previous arbitrary classes
      function noop() {}
      noop[proto] = this[proto]
      var supr = this
        , prototype = new noop()
        , isFunction = isFn(o)
        , _constructor = isFunction ? o : this
        , _methods = isFunction ? {} : o
      function fn() {
        if (this.initialize) this.initialize.apply(this, arguments)
        else {
          fromSub || isFunction && supr.apply(this, arguments)
          _constructor.apply(this, arguments)
        }
      }

      fn.methods = function (o) {
        process(prototype, o, supr)
        fn[proto] = prototype
        return this
      }

      fn.methods.call(fn, _methods).prototype.constructor = fn

      fn.extend = arguments.callee
      fn[proto].implement = fn.statics = function (o, optFn) {
        o = typeof o == 'string' ? (function () {
          var obj = {}
          obj[o] = optFn
          return obj
        }()) : o
        process(this, o, supr)
        return this
      }

      return fn
    }

    klass.noConflict = function () {
      context.klass = old
      return this
    }
    context.klass = klass

    return klass
  }();

})('object' === typeof module ? module.exports : (this.KadOH = this.KadOH || {}));

(function(exports){

  var KadOH = exports;
  var Class = KadOH.core.Class;
  
  KadOH.util = {};
  var Crypto = KadOH.util.Crypto = {};

  Crypto.util = Class().statics({
    // Bit-wise rotate left
    rotl: function (n, b) {
      return (n << b) | (n >>> (32 - b));
    },

    // Bit-wise rotate right
    rotr: function (n, b) {
      return (n << (32 - b)) | (n >>> b);
    },

    // Swap big-endian to little-endian and vice versa
    endian: function (n) {
      // If number given, swap endian
      if (n.constructor == Number) {
        return Crypto.util.rotl(n,  8) & 0x00FF00FF | Crypto.util.rotl(n, 24) & 0xFF00FF00;
      }

      // Else, assume array and swap all items
      for (var i = 0; i < n.length; i++)
        n[i] = Crypto.util.endian(n[i]);
      return n;
    },

    // Generate an array of any length of random bytes
    randomBytes: function (n) {
      for (var bytes = []; n > 0; n--)
      bytes.push(Math.floor(Math.random() * 256));
      return bytes;
    },

    // Convert a byte array to big-endian 32-bit words
    bytesToWords: function (bytes) {
      for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
        words[b >>> 5] |= bytes[i] << (24 - b % 32);
      return words;
    },

    // Convert big-endian 32-bit words to a byte array
    wordsToBytes: function (words) {
      for (var bytes = [], b = 0; b < words.length * 32; b += 8)
        bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
      return bytes;
    },

    // Convert a byte array to a hex string
    bytesToHex: function (bytes) {
      for (var hex = [], i = 0; i < bytes.length; i++) {
        hex.push((bytes[i] >>> 4).toString(16));
        hex.push((bytes[i] & 0xF).toString(16));
      }
      return hex.join("");
    },

    // Convert a hex string to a byte array
    hexToBytes: function (hex) {
      for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
      return bytes;
    },

    /**
     * Return the bytes XOR of two hexadecimal strings
     *
     * @param {String} hex1 the first hexadecimal string
     * @param {String} hex2 the second hexadecimal string
     * @return {Array} the bytes `Array` of the XOR
     */
    XOR: function(hex1, hex2) {
      if (hex1.length != hex2.length)
        return;

      if ('string' === typeof hex1)
        hex1 = Crypto.util.hexToBytes(hex1);
      if ('string' === typeof hex2)
        hex2 = Crypto.util.hexToBytes(hex2);

      var xor = [];
      for (var i = 0; i < hex1.length; i++) {
        xor.push(hex1[i] ^ hex2[i]);
      }
      return xor;
    },
    
    /**
     * Return the position of the first different bit between two hexadecimal strings
     * 
     * @param {String} hex1 the first hexadecimal string
     * @param {String} hex2 the second hexadecimal string
     * @return {Integer} the position of the bit
     */
    distance: function(hex1, hex2) {
      if (hex1 === hex2)
        return 0;

      if ('string' === typeof hex1)
        hex1 = Crypto.util.hexToBytes(hex1);
      if ('string' === typeof hex2)
        hex2 = Crypto.util.hexToBytes(hex2);

      var length = hex1.length;
      if (length != hex2.length) {
        return -1;
      }

      var max_dist = 8*length;

      for (i = 0; i < length; i++) {
        var diff = hex1[i] ^ hex2[i];

        if (diff) {
          for (var j = 0; j < 7; j++) {
            if (diff >>> (7 - j))
              break;
          }
          return max_dist - 8*i - j;
        }
      }
      return 0;
    }

  });

  Crypto.charenc = {};
  Crypto.charenc.Binary = Class().statics({

    // Convert a string to a byte array
    stringToBytes: function (str) {
      for (var bytes = [], i = 0; i < str.length; i++)
      bytes.push(str.charCodeAt(i) & 0xFF);
      return bytes;
    },

    // Convert a byte array to a string
    bytesToString: function (bytes) {
      for (var str = [], i = 0; i < bytes.length; i++)
      str.push(String.fromCharCode(bytes[i]));
      return str.join("");
    }

  });

  Crypto.charenc.UTF8 = Class().statics({

    // Convert a string to a byte array
    stringToBytes: function (str) {
      return Crypto.charenc.Binary.stringToBytes(unescape(encodeURIComponent(str)));
    },

    // Convert a byte array to a string
    bytesToString: function (bytes) {
      return decodeURIComponent(escape(Crypto.charenc.Binary.bytesToString(bytes)));
    }

  });

  // Digest (SHA1)

  Crypto.digest = Class().statics({

    SHA1: function(message, options) {
      var digestbytes = Crypto.util.wordsToBytes(Crypto.digest._sha1(message));
      return options && options.asBytes ? digestbytes : options && options.asString ? Crypto.charenc.Binary.bytesToString(digestbytes) : Crypto.util.bytesToHex(digestbytes);
    },

    _sha1: function (message) {
      // Convert to byte array
      if (message.constructor == String) message = Crypto.charenc.UTF8.stringToBytes(message);
      
      /* else, assume byte array already */
      var m  = Crypto.util.bytesToWords(message),
      l  = message.length * 8,
      w  =  [],
      H0 =  1732584193,
      H1 = -271733879,
      H2 = -1732584194,
      H3 =  271733878,
      H4 = -1009589776;

      // Padding
      m[l >> 5] |= 0x80 << (24 - l % 32);
      m[((l + 64 >>> 9) << 4) + 15] = l;

      for (var i = 0; i < m.length; i += 16) {

        var a = H0,
        b = H1,
        c = H2,
        d = H3,
        e = H4;

        for (var j = 0; j < 80; j++) {

          if (j < 16) w[j] = m[i + j];
          else {
            var n = w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16];
            w[j] = (n << 1) | (n >>> 31);
          }

          var t = ((H0 << 5) | (H0 >>> 27)) + H4 + (w[j] >>> 0) + (
            j < 20 ? (H1 & H2 | ~H1 & H3) + 1518500249 :
            j < 40 ? (H1 ^ H2 ^ H3) + 1859775393 :
            j < 60 ? (H1 & H2 | H1 & H3 | H2 & H3) - 1894007588 :
            (H1 ^ H2 ^ H3) - 899497514);

          H4 =  H3;
          H3  =  H2;
          H2 = (H1 << 30) | (H1 >>> 2);
          H1 =  H0;
          H0 =  t;

        }

        H0 += a;
        H1 += b;
        H2 += c;
        H3 += d;
        H4 += e;

      }

      return [H0, H1, H2, H3, H4];
    },

    // Package private blocksize
    _blocksize: 16,

    _digestsize: 20
  });
})('object' === typeof module ? module.exports : (this.KadOH = this.KadOH || {}));

(function(exports) {
  
  var KadOH = exports;
  KadOH.globals = {};
  
  // Maximum number of contacts in a k-bucket
  KadOH.globals._k = 6;

  // Degree of parallelism for network calls
  KadOH.globals._alpha = 3;

  // Size of the space in bits
  KadOH.globals._B = 160;

  // sha1 function
  KadOH.globals._digest = KadOH.util.Crypto.digest.SHA1;
  
})('object' === typeof module ? module.exports : (this.KadOH = this.KadOH || {}));
(function(exports) {
  
  var KadOH = exports;
  var Class = KadOH.core.Class;
  
  KadOH.Node = Class({

    initialize: function(ip, port, id) {
      if (typeof id === 'undefined') {
        this.id = this._generateId();
      } else {
        this.id = id;
      }

      this._routing_table = new RoutingTable(this.id);
    },
    
    addPeer: function(peer) {
      this._routing_table.addPeer(peer);
    },
    
    removePeer: function(peer) {
      this._routing_table.removePeer(peer);
    },
    
    // RPC
    
    ping: function() {
      
    },
    
    findNode: function() {
      
    },
    
    // Private

    _generateId: function() {
      return KadOH.globals._digest(this.ip + ':' + this.port);
    }

  });
  
})('object' === typeof module ? module.exports : (this.KadOH = this.KadOH || {}));

(function(exports) {
  
  var KadOH = exports;
  var Class = KadOH.core.Class;
  
  KadOH.RoutingTable = Class({

    initialize: function(parent_id) {
      this._parent_id = parent_id;
      this._kbuckets = [new KadOH.KBucket(0, KadOH.globals._B, parent_id)];
    },

    // Public

    /**
     * Calculates the distance from 0 to B-1 between the parent id and the given key
     * These keys are SHA1 hashes as hexadecimal `String`
     *
     * @param {String} key
     * @return {String} distance between the two keys
     * @api public 
     */
    distance: function(id) {
      return KadOH.util.Crypto.util.distance(this._parent_id, id);
    },

    /**
     * Add a peer to the routing table or update it if its already in
     * 
     * @param {Peer} peer object to add
     * @return {Void}
     * @api public 
     */
    addPeer: function(peer) {
      if (peer.getId() == this._parent_id) {
        return;
      }

      var kbucket_index = this._kbucketIndexFor(peer.getId());
      var kbucket = this._kbuckets[kbucket_index];

      // find the kbucket for the peer
      try {
        kbucket.addPeer(peer);
      }
      // if the kbucket is full, try to split it in two
      catch(e) {
        // if the kbucket is splittable split it and try again
        if(kbucket.isSplittable(this.distance(peer.getId()))) {
          var new_kbucket = kbucket.split();
          
          // console.log('SPLITTING ROUTING TABLE : ' + kbucket + ' ' + new_kbucket);
          this._kbuckets.splice(kbucket_index + 1, 0, new_kbucket);
          
          this.addPeer(peer);
        }
        // if the kbucket is not splittable, remove the least recently seen peer and add the new
        // @TODO optimisations
        else {
          kbucket.removePeer(kbucket.getOldestPeer());
          kbucket.addPeer(peer);
        }
      }
    },

    getPeer: function(id) {
      var peer = this._kbucketFor(id).getPeer(id);
      if (peer) {
        return peer;
      }
      return false;
    },

    removePeer: function(peer) {
      if (typeof peer === 'object') {
        peer = peer.getId();
      }
      return this._kbucketFor(peer).removePeer(peer);
    },

    getKBuckets: function() {
      return this._kbuckets;
    },

    howManyKBuckets: function() {
      return this._kbuckets.length;
    },

    getParentId: function() {
      return this._parent_id;
    },

    // Private

    /**
     * Find the appropriate KBucket index for a given key
     *
     * @param {String} key SHA1 hash
     * @return {Integer} index for the `_kbuckets`
     * @api private
     */
    _kbucketIndexFor: function(id) {
      dist = this.distance(id);

      for(var kbucket=0; kbucket < this._kbuckets.length; kbucket++) {
        if (this._kbuckets[kbucket].distanceInRange(dist)) {
          return kbucket;
        }
      }
      return -1;
    },

    _kbucketFor: function(id) {
      var index = this._kbucketIndexFor(id);
      if (index != -1)
        return this._kbuckets[index];
      return false;
    }

  });
  
})('object' === typeof module ? module.exports : (this.KadOH = this.KadOH || {}));

(function(exports) {
  
  var KadOH = exports;
  var Class = KadOH.core.Class;
  
  var Crypto = KadOH.util.Crypto;
  
  KadOH.KBucket = Class({

    initialize: function(min, max, parent_id) {
      this._min = (typeof min === 'undefined') ? 0  : min;
      this._max = (typeof max === 'undefined') ? KadOH.globals._B : max;

      this._parent_id = parent_id;
      this._size = 0;
      this._distances = [];
      this._peers_ids = [];
      this._peers = {};
    },

    // Public

    addPeer: function(peer) {
      var exists = this._peerExists(peer);
      // if the peer is already in the kbucket, delete it and append it at the beginning of the list
      if (exists != false) {
        this._updatePeer(exists);
      }
      // if it isn't
      else {
        //  and the kbucket is not full, add it at the beginning of the list
        if (!this.isFull()) {
          this._appendPeer(peer);
        }
        // and the kbucket is full throw an error
        else {
          console.error('The kbucket ' + this.toString() + 'is full');
          throw new Error('FULL');
        }
      }
      
      return this;
    },

    getPeer: function(peer) {
      var tuple = this._peerExists(peer)
      if (tuple === false)
        return false;

      return this._peers[tuple.id];
    },
    
    getOldestPeer: function() {
      return this._peers[this._peers_ids[this._size-1]];
    },

    getPeers: function(number) {
      var peers = [];
      number = Math.max(0, Math.min(number, this._size));
      
      for (var i=0; i < this._size; i++) {
        peers.push(this._peers[this._peers_ids[i]]);
      }
      
      return peers;
    },

    removePeer: function(peer) {
      var tuple = this._peerExists(peer);
      if (tuple === false) {
        throw new Error(peer + ' does not exists');
      } else {
        this._deletePeer(tuple);
      }

      return this;
    },

    idInRange: function(id, parent_id) {
      return this.distanceInRange(Crypto.util.distance(id, parent_id));
    },

    distanceInRange: function(distance) {
      return (this._min < distance) && (distance <= this._max);
    },

    getSize: function() {
      return this._size;
    },

    getRange: function() {
      return {
          min: this._min
        , max: this._max
      }
    },

    setRange: function(range) {
      this._min = range.min;
      this._max = range.max;
      return this;
    },

    setRangeMin: function(min) {
      this._min = min;
      return this;
    },

    setRangeMax: function(max) {
      this._max = max;
      return this;
    },

    split: function() {
      var split_value = ( this._min + this._max ) / 2;

      var new_kbucket = new KadOH.KBucket(this._min, split_value - 1, this._parent_id);
      this.setRangeMin(split_value);

      var i;
      var destroy_ids = [];

      for (i=0; i < this._size; i++) {
        var peer_id = this._peers_ids[i];
        var peer = this._peers[peer_id];
        var distance = this._distances[peer_id];

        if (new_kbucket.distanceInRange(distance)) {
          new_kbucket.addPeer(peer);
          destroy_ids.push(peer_id);
        }
      }

      for (i=0; i < destroy_ids.length; i++) {
        this.removePeer(destroy_ids[i]);
      }

      return new_kbucket;
    },

    isSplittable: function() {
      return (this._min === 0);
    },

    isFull: function() {
      return (this._size == KadOH.globals._k);
    },

    toString: function() {
      return '<' + this._min + ':' + this._max + '><#' + this._peers_ids.length + '>';
    },

    // Private

    _updatePeer: function(tuple) {
      delete this._peers_ids[tuple.index];
      this._peers_ids.unshift(tuple.id);
    },
    
    _deletePeer: function(tuple) {
      delete this._peers_ids[tuple.index];
      delete this._peers[tuple.id];
      delete this._distances[tuple.index];

      this._size--;
    },

    _appendPeer: function(peer) {
      var id = peer.getId();
      this._peers[id] = peer;
      this._peers_ids.unshift(id);
      this._distances[id] = Crypto.util.distance(id, this._parent_id);
      
      this._size++;
    },

    _peerExists: function(peer) {
      var peer_id, index;

      if (typeof peer === 'object') {
        peer_id = peer.getId();
        index = this._peers_ids.indexOf(peer_id);
      } else {
        peer_id = peer;
        index = this._peers_ids.indexOf(peer);
      }

      if (index === -1) {
        return false;
      }

      return {
          index: index
        , id: peer_id
      };
    }
    
  });
  
})('object' === typeof module ? module.exports : (this.KadOH = this.KadOH || {}));

(function(exports) {
  
  var KadOH = exports;
  var Class = KadOH.core.Class;
  
  KadOH.Peer = Class({

    initialize: function(ip, port, id) {
      this._ip = ip;
      this._port = port;
      this._socket = ip + ':' + port;

      if (typeof id === 'undefined') {
        this._id = this._generateId();
      } else {
        this._id = id;
      }
    },

    // Public
    getID: function() {
      return this.getId();
    },
    
    getId: function() {
      return this._id;
    },

    getSocket: function() {
      return this._socket;
    },

    toString: function() {
      return '<' + this._id + '; ' + this._socket + '>';
    },

    // Private
    _generateId: function() {
      return KadOH.globals._digest(this._socket); 
    }

  });
  
  
})('object' === typeof module ? module.exports : (this.KadOH = this.KadOH || {}));
