import { expect } from 'chai';
import { tripleliftAdapterSpec } from 'modules/tripleliftBidAdapter';
import { newBidder } from 'src/adapters/bidderFactory';
import { deepClone } from 'src/utils';
import prebid from '../../../package.json';

const ENDPOINT = 'https://tlx.3lift.com/header/auction?';

describe('triplelift adapter', function () {
  const adapter = newBidder(tripleliftAdapterSpec);

  describe('inherited functions', function () {
    it('exists and is a function', function () {
      expect(adapter.callBids).to.exist.and.to.be.a('function');
    });
  });

  describe('isBidRequestValid', function () {
    let bid = {
      bidder: 'triplelift',
      params: {
        inventoryCode: '12345',
        floor: 1.0,
      },
      'adUnitCode': 'adunit-code',
      'sizes': [[300, 250], [300, 600]],
      'bidId': '30b31c1838de1e',
      'bidderRequestId': '22edbae2733bf6',
      'auctionId': '1d1a030790a475',
    };

    it('should return true for valid bid request', function () {
      expect(tripleliftAdapterSpec.isBidRequestValid(bid)).to.equal(true);
    });

    it('should return true when required params found', function () {
      let bid = Object.assign({}, bid);
      delete bid.params;
      bid.params = {
        inventoryCode: 'another_inv_code',
        floor: 0.05
      };
      expect(tripleliftAdapterSpec.isBidRequestValid(bid)).to.equal(true);
    });

    it('should return false when required params are not passed', function () {
      let bid = Object.assign({}, bid);
      delete bid.params;
      bid.params = {
        floor: 1.0
      };
      expect(tripleliftAdapterSpec.isBidRequestValid(bid)).to.equal(false);
    });
  });

  describe('buildRequests', function () {
    let bidRequests = [
      {
        bidder: 'triplelift',
        params: {
          inventoryCode: '12345',
          floor: 1.0,
        },
        adUnitCode: 'adunit-code',
        sizes: [[300, 250], [300, 600], [1, 1, 1], ['flex']],
        bidId: '30b31c1838de1e',
        bidderRequestId: '22edbae2733bf6',
        auctionId: '1d1a030790a475',
      }
    ];

    let bidderRequest = {
      bidderCode: 'triplelift',
      auctionId: 'a7ebcd1d-66ff-4b5c-a82c-6a21a6ee5a18',
      bidderRequestId: '5c55612f99bc11',
      bids: [
        {
          imp_id: 0,
          cpm: 1.062,
          width: 300,
          height: 250,
          ad: 'ad-markup',
          iurl: 'https://s.adroll.com/a/IYR/N36/IYRN366MFVDITBAGNNT5U6.jpg'
        }
      ],
      refererInfo: {
        referer: 'http://examplereferer.com'
      },
      gdprConsent: {
        consentString: 'BOONm0NOONm0NABABAENAa-AAAARh7______b9_3__7_9uz_Kv_K7Vf7nnG072lPVA9LTOQ6gEaY',
        gdprApplies: true
      },
      userId: {
        tdid: '6bca7f6b-a98a-46c0-be05-6020f7604598'
      }
    };

    it('exists and is an object', function () {
      const request = tripleliftAdapterSpec.buildRequests(bidRequests, bidderRequest);
      expect(request).to.exist.and.to.be.a('object');
    });

    it('should only parse sizes that are of the proper length and format', function () {
      const request = tripleliftAdapterSpec.buildRequests(bidRequests, bidderRequest);
      expect(request.data.imp[0].banner.format).to.have.length(2);
      expect(request.data.imp[0].banner.format).to.deep.equal([{w: 300, h: 250}, {w: 300, h: 600}]);
    });

    it('should be a post request and populate the payload', function () {
      const request = tripleliftAdapterSpec.buildRequests(bidRequests, bidderRequest);
      const payload = request.data;
      expect(payload).to.exist;
      expect(payload.imp[0].tagid).to.equal('12345');
      expect(payload.imp[0].floor).to.equal(1.0);
      expect(payload.imp[0].banner.format).to.deep.equal([{w: 300, h: 250}, {w: 300, h: 600}]);
    });

    it('should add tdid to the payload if included', function () {
      const request = tripleliftAdapterSpec.buildRequests(bidRequests, bidderRequest);
      const payload = request.data;
      expect(payload).to.exist;
      expect(payload.user).to.deep.equal({ext: {eids: [{source: 'adserver.org', uids: [{id: '6bca7f6b-a98a-46c0-be05-6020f7604598', ext: {rtiPartner: 'TDID'}}]}]}});
    });

    it('should return a query string for TL call', function () {
      const request = tripleliftAdapterSpec.buildRequests(bidRequests, bidderRequest);
      const url = request.url;
      expect(url).to.exist;
      expect(url).to.be.a('string');
      expect(url).to.match(/(?:tlx.3lift.com\/header\/auction)/)
      expect(url).to.match(/(?:lib=prebid)/)
      expect(url).to.match(new RegExp('(?:' + prebid.version + ')'))
      expect(url).to.match(/(?:referrer)/);
    });
  });

  describe('interpretResponse', function () {
    let response = {
      body: {
        bids: [
          {
            imp_id: 0,
            cpm: 1.062,
            width: 300,
            height: 250,
            ad: 'ad-markup',
            iurl: 'https://s.adroll.com/a/IYR/N36/IYRN366MFVDITBAGNNT5U6.jpg'
          }
        ]
      }
    };
    let bidderRequest = {
      bidderCode: 'triplelift',
      auctionId: 'a7ebcd1d-66ff-4b5c-a82c-6a21a6ee5a18',
      bidderRequestId: '5c55612f99bc11',
      bids: [
        {
          imp_id: 0,
          cpm: 1.062,
          width: 300,
          height: 250,
          ad: 'ad-markup',
          iurl: 'https://s.adroll.com/a/IYR/N36/IYRN366MFVDITBAGNNT5U6.jpg'
        }
      ],
      refererInfo: {
        referer: 'http://examplereferer.com'
      },
      gdprConsent: {
        consentString: 'BOONm0NOONm0NABABAENAa-AAAARh7______b9_3__7_9uz_Kv_K7Vf7nnG072lPVA9LTOQ6gEaY',
        gdprApplies: true
      }
    };

    it('should get correct bid response', function () {
      let expectedResponse = [
        {
          requestId: '3db3773286ee59',
          cpm: 1.062,
          width: 300,
          height: 250,
          netRevenue: true,
          ad: 'ad-markup',
          creativeId: 29681110,
          dealId: '',
          currency: 'USD',
          ttl: 33,
        }
      ];
      let result = tripleliftAdapterSpec.interpretResponse(response, {bidderRequest});
      expect(result).to.have.length(1);
      expect(Object.keys(result[0])).to.have.members(Object.keys(expectedResponse[0]));
    });

    it('should return multile responses to support SRA', function () {
      let response = {
        body: {
          bids: [
            {
              imp_id: 0,
              cpm: 1.062,
              width: 300,
              height: 250,
              ad: 'ad-markup',
              iurl: 'https://s.adroll.com/a/IYR/N36/IYRN366MFVDITBAGNNT5U6.jpg'
            },
            {
              imp_id: 0,
              cpm: 1.9,
              width: 300,
              height: 600,
              ad: 'ad-markup-2',
              iurl: 'https://s.adroll.com/a/IYR/N36/IYRN366MFVDITBAGNNT5U6.jpg'
            }
          ]
        }
      };
      let bidderRequest = {
        bidderCode: 'triplelift',
        auctionId: 'a7ebcd1d-66ff-4b5c-a82c-6a21a6ee5a18',
        bidderRequestId: '5c55612f99bc11',
        bids: [
          {
            imp_id: 0,
            cpm: 1.062,
            width: 300,
            height: 600,
            ad: 'ad-markup',
            iurl: 'https://s.adroll.com/a/IYR/N36/IYRN366MFVDITBAGNNT5U6.jpg'
          },
          {
            imp_id: 0,
            cpm: 1.9,
            width: 300,
            height: 250,
            ad: 'ad-markup-2',
            iurl: 'https://s.adroll.com/a/IYR/N36/IYRN366MFVDITBAGNNT5U6.jpg'
          }
        ],
        refererInfo: {
          referer: 'http://examplereferer.com'
        },
        gdprConsent: {
          consentString: 'BOONm0NOONm0NABABAENAa-AAAARh7______b9_3__7_9uz_Kv_K7Vf7nnG072lPVA9LTOQ6gEaY',
          gdprApplies: true
        }
      };
      let result = tripleliftAdapterSpec.interpretResponse(response, {bidderRequest});
      expect(result).to.have.length(2);
    });
  });
});
