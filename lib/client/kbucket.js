// Dep: [KadOH]/core/class
// Dep: [KadOH]/globals
// Dep: [KadOH]/util/crypto
// Dep: [KadOH]/peer
// Dep: [KadOH]/peerarray

(function(exports) {
  
  var KadOH = exports;

  var Class     = KadOH.core.Class,
      globals   = KadOH.globals,
      Crypto    = KadOH.util.Crypto,
      Peer      = KadOH.Peer,
      PeerArray = KadOH.PeerArray;

  var XORSortedPeerArray = KadOH.XORSortedPeerArray;
  
  KadOH.KBucket = PeerArray.extend(
    /** @lends KBucket# */
    {
    /**
     * 
     * @class Namespace : KadOH.KBucket </br> Represents a KBucket.
     * @constructs
     * @param  {PeerID} parentID - NodeID of the parent
     * @param  {Number} [min=0] - Min limit of this KBucket (expressed as bit position)
     * @param  {Number} [max=globals.B] - Max limit of this KBucket (expressed as bit position)
     */
    initialize: function(parent_id, min, max) {
      if (parent_id instanceof PeerArray) {
        if (parent_id instanceof this.constructor)
          this._parentID = parent_id._parentID;
        this.supr(parent_id);
      } else {
        this._parentID = parent_id;
        this.supr();
      }

      this._min = min || 0;
      this._max = max || globals.B;
    },

    // Public

    /**
     * Add then given Peer to the KBucket
     * If the Peer is already in the KBucket, it will be updated
     *
     * @param {Peer} peer - The peer to add or update
     * @return {KBucket} self to allow chaining
     */
    addPeer: function(peer) {
      if (!this.isFull()) {
        var index = this.find(peer);
        if (~index) {
          this.getPeer(index).touch();
          this.move(index, 0);
        }
        else {
          peer.cacheDistance(this._parentID);
          if (!this.peerInRange(peer))
            throw new Error(peer + ' is not in range for ' + this);
          
          peer.touch();
          this._PEERS.unshift(peer);
        }
      }
      else {
        // and if the kbucket is full throw an error
        throw new Error('FULL');
      }
      return this;
    },

    /**
     * Get the latest seen Peer.
     *
     * @return {Peer}
     */
    getNewestPeer: function() {
      return this.getPeer(0);
    },
    
    /**
     * Get the least recent Peer.
     *
     * @return {Peer}
     */
    getOldestPeer: function() {
      return this.getPeer(this.length());
    },
    
    /**
     * Get all the peers from the KBucket
     *
     * @param {Integer} number - fix the number of peers to get
     * @param {String[]|Peer[]} exclude - the NodeIDs or {@link Peer}s to exclude
     * @return {Array}
     */
    getPeers: function(number, exclude) {
      exclude = exclude || [];
      return this.filterOut(exclude).pickOutFirst(number);
    },

    peerInRange: function(peer) {
      return this.distanceInRange(peer.getDistance());
    },
    
    /**
     * Check wether or not the given NodeID is in range of the KBucket
     * @param {String} id - NodeID to check
     * @return {Boolean} true if it is in range.
     */
    idInRange: function(id) {
      return this.distanceInRange(Crypto.distance(id, this._parentID));
    },
    
    /**
     * Check wether or not a given distance is in range of the 
     * 
     * @param {String} distance - distance to check
     * @return {Boolean}
     */
    distanceInRange: function(distance) {
      return (this._min < distance) && (distance <= this._max);
    },

    /**
     * Get an `Object` with the `min` and `max` values of the KBucket's range (expressed as bit position).
     *
     * @return {Object} range - range object
     * @return {Integer} range.min - minimum bit position
     * @return {Integer} renage.max - maximum bit position
     */
    getRange: function() {
      return {
        min: this._min,
        max: this._max
      };
    },

    /**
     * Set the range of the KBucket (expressed as bit position)
     *
     * @param {Object} range - range object
     * @param {Integer} range.min - minimum bit position
     * @param {Integer} range.max - maximum bit position
     * @return {KBucket} self to allow chaining
     */
    setRange: function(range) {
      this._min = range.min;
      this._max = range.max;
      return this;
    },

    /**
     * Set the range min of the KBucket (expressed as bit position)
     *
     * @param {Integer} min - minimum bit position
     * @return {KBucket} self to allow chaining
     */
    setRangeMin: function(min) {
      this._min = min;
      return this;
    },
    
    /**
     * Set the range max of the KBucket (expressed as bit position)
     *
     * @param {Integer} max - max bit position
     * @return {KBucket} self to allow chaining
     */
    setRangeMax: function(max) {
      this._max = max;
      return this;
    },

    /**
     * Split the KBucket range in half (higher range) and return a new KBucket with the lower range
     *
     * @return {KBucket} The created KBucket
     */
    split: function() {
      var split_value = this._max - 1;

      var new_kbucket = new this.constructor(this._parentID, this._min, split_value);
      this.setRangeMin(split_value);

      var i, 
          peer,
          trash = [];
      for (i = 0; i < this.length(); i++) {
        peer = this._PEERS[i];
        if (new_kbucket.peerInRange(peer)) {
          trash.push(peer);
          new_kbucket.addPeer(peer);
        }
      }
      this.remove(trash);

      return new_kbucket;
    },

    /**
     * Check wether or not the KBucket is splittable
     *
     * @return {Boolean} true if splittable
     */
    isSplittable: function() {
      return (this._min === 0);
    },

    /**
     * Check wether or not the KBucket is full
     *
     * @return {Boolean} true if full
     */
    isFull: function() {
      return (this.length() == globals.K);
    },

    /**
     * Represent the KBucket as a String
     * @return {String} representation of the KBucket
     */
    toString: function() {
      return '<' + this._min + ':' + this._max + '><#' + this.length() + '>';
    }
    
  });
  
})('object' === typeof module ? module.exports : (this.KadOH = this.KadOH || {}));