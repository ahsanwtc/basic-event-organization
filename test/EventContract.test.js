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

  context('buyTickt', () => {
    let event = null;
    before(async () => {
      const price = 10, date = (await time.latest()).add(time.duration.seconds(4000)).toNumber(), ticketCount = 10;
      await eventContract.createEvent('Event', date, price, ticketCount, { from: accounts[0] });
      event = await eventContract.events(0);
    });

    it('should buy tickets', async () => {
      const quantity = 4;
      await eventContract.buyTicket(event.id, quantity, { from: accounts[1], value: quantity * event.price });
      assert((await eventContract.tickets(accounts[1], event.id)).toNumber() === quantity);
      assert((await eventContract.events(event.id)).ticketRemaining.toNumber() === (event.ticketCount -  quantity));
    });

    it('should NOT buy tickets when no enough tickts left', async () => {
      const quantity = 11;
      expectRevert(
        eventContract.buyTicket(event.id, quantity, { from: accounts[1], value: quantity * event.price }),
        'not enough tickets left'
      );
    });

    it('should NOT buy tickets when not enough ether sent', async () => {
      const quantity = 5;
      expectRevert(
        eventContract.buyTicket(event.id, quantity, { from: accounts[1], value: (quantity * event.price) - 5 }),
        'not enough ether sent'
      );
    });

    it('should NOT buy tickets when event does not exist', async () => {
      const quantity = 5;
      expectRevert(
        eventContract.buyTicket(1, quantity, { from: accounts[1], value: (quantity * event.price) - 5 }),
        'event does not exist'
      );
    });

    it('should NOT buy tickets when event is not active', async () => {
      const eventContract = await EventContract.new();
      const price = 10, date = (await time.latest()).add(time.duration.seconds(5)).toNumber(), ticketCount = 10;
      await eventContract.createEvent('Event', date, price, ticketCount, { from: accounts[0] });
      const event = await eventContract.events(0);
      await time.increase(5001);

      const quantity = 5;
      expectRevert(
        eventContract.buyTicket(0, quantity, { from: accounts[1], value: (quantity * event.price) }),
        'event is not active anymore'
      );
    });

  });

});
