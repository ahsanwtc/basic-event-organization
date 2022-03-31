const { expectRevert, time } = require('@openzeppelin/test-helpers');
const EventContract = artifacts.require("EventContract");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("EventContract", accounts => {
  let eventContract = null;

  before('get instance of the contract', async () => {
    eventContract = await EventContract.new();
  });

  it('should create an event', async () => {
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

  context('there is an event', () => {
    let event = null, eventId = null;
    
    before('before there is an event', async () => {
      const price = 10, date = (await time.latest()).add(time.duration.seconds(4000)).toNumber(), ticketCount = 10;
      await eventContract.createEvent('Event Two', date, price, ticketCount, { from: accounts[0] });
      event = await eventContract.events(0);
      eventId = event.id.toNumber();
    });

    it('should buy tickets', async () => {
      const quantity = 4;
      await eventContract.buyTicket(event.id.toNumber(), quantity, { from: accounts[1], value: quantity * event.price.toNumber() });
      assert((await eventContract.tickets(accounts[1], 0)).toNumber() === quantity);
      assert((await eventContract.events(event.id.toNumber())).ticketRemaining.toNumber() === (event.ticketCount.toNumber() -  quantity));
    });

    it('should NOT buy tickets when no enough tickts left', async () => {
      const quantity = 11;
      await expectRevert(
        eventContract.buyTicket(event.id.toNumber(), quantity, { from: accounts[1], value: quantity * event.price.toNumber() }),
        'not enough tickets left'
      );
    });

    it('should NOT buy tickets when not enough ether sent', async () => {
      const quantity = 5;
      await expectRevert(
        eventContract.buyTicket(event.id.toNumber(), quantity, { from: accounts[1], value: (quantity * event.price.toNumber()) - 5 }),
        'not enough ether sent'
      );
    });

    it('should NOT buy tickets when event does not exist', async () => {
      const quantity = 5;
      await expectRevert(
        eventContract.buyTicket(5, quantity, { from: accounts[1], value: (quantity * event.price.toNumber()) }),
        'event does not exist'
      );
    });

    it('should transfer ticket', async () => {
      const quantity = 2;
      await eventContract.transferTicket(event.id.toNumber(), quantity, accounts[3], { from: accounts[1] });
      assert((await eventContract.tickets(accounts[1], event.id.toNumber())).toNumber() === 2);
      assert((await eventContract.tickets(accounts[3], event.id.toNumber())).toNumber() === 2);
    });

    it('should NOT transfer ticket if quantity is too high', async () => {
      const quantity = 5;
      await expectRevert(
        eventContract.transferTicket(event.id.toNumber(), quantity, accounts[3], { from: accounts[1] }),
        'not enough tickets'
      );      
    });
  });

  context('event is not active anymore', () => {
    let event = null;
    before(async () => {
      const price = 10, date = (await time.latest()).add(time.duration.seconds(5)).toNumber(), ticketCount = 10;
      await eventContract.createEvent('Event', date, price, ticketCount, { from: accounts[0] });
      event = await eventContract.events(0);
      await time.increase(5001);
    });

    it('should NOT buy tickets', async () => {
      const quantity = 5;
      await expectRevert(
        eventContract.buyTicket(event.id.toNumber(), quantity, { from: accounts[1], value: (quantity * event.price.toNumber()) }),
        'event is not active anymore'
      );
    });

    it('should NOT transfer tickets', async () => {
      const quantity = 2;
      await expectRevert(
        eventContract.transferTicket(event.id.toNumber(), quantity, accounts[3], { from: accounts[1] }),
        'event is not active anymore'
      );      
    });
  });

  context('there is no event', () => {
    it('should NOT buy tickets', async () => {
      const quantity = 5;
      await expectRevert(
        eventContract.buyTicket(5, quantity, { from: accounts[1], value: 10 }),
        'event does not exist'
      );
    });

    it('should NOT transfer tickets', async () => {
      const quantity = 2;
      await expectRevert(
        eventContract.transferTicket(5, quantity, accounts[3], { from: accounts[1] }),
        'event does not exist'
      );      
    });
  });

});
