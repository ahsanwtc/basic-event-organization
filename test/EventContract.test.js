const { expectRevert, time } = require('@openzeppelin/test-helpers');
const EventContract = artifacts.require("EventContract");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("EventContract", accounts => {
  let eventContract = null;

  before(async () => {
    eventContract = await EventContract.new();
  });

  it('creates an event', async () => {
    const price = 10, date = (await time.latest()).add(time.duration.seconds(4000)).toNumber(), ticketCount = 10;
    await eventContract.createEvent('Event One', date, price, ticketCount, { from: accounts[0] });
    const event = await eventContract.events(0);
    assert(event.name === 'Event One');
    assert(event.price.toNumber() === price);
    assert(event.date.toNumber() === date);
    assert(event.ticketCount.toNumber() === ticketCount);
    assert(event.ticketRemaining.toNumber() === ticketCount);
    assert(event.admin === accounts[0]);
  });

});
