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

  it('should create an event', async () => {
    const price = 10, date = (await time.latest()).add(time.duration.seconds(4000)).toNumber(), ticketCount = 10;
    await eventContract.createEvent('Event', date, price, ticketCount, { from: accounts[0] });
    const event = await eventContract.events(0);
    assert(event.name === 'Event');
    assert(event.price.toNumber() === price);
    assert(event.date.toNumber() === date);
    assert(event.ticketCount.toNumber() === ticketCount);
    assert(event.ticketRemaining.toNumber() === ticketCount);
    assert(event.admin === accounts[0]);
  });

  it('should NOT create a past event', async () => {
    const price = 10, date = (await time.latest()).sub(time.duration.seconds(5)).toNumber(), ticketCount = 10;
    await expectRevert(
      eventContract.createEvent('Event', date, price, ticketCount, { from: accounts[0] }),
      'an event can only be created at a future date'
    );
  });

  it('should NOT create an event with no tickets', async () => {
    const price = 10, date = (await time.latest()).add(time.duration.seconds(1000)).toNumber(), ticketCount = 0;
    await expectRevert(
      eventContract.createEvent('Event', date, price, ticketCount, { from: accounts[0] }),
      'an event can only be created with 1 or more tickets'
    );
  });

});
