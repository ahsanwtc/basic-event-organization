// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
// import "@openzeppelin/contracts/utils/Strings.sol";

contract EventContract {
  struct Event {
    uint id;
    address admin;
    string name;
    uint date;
    uint price;
    uint ticketCount;
    uint ticketRemaining;
  }
  mapping(uint => Event) public events;
  mapping(address => mapping(uint => uint)) public tickets;
  uint public nextEventId;

  function createEvent(string calldata name, uint date, uint price, uint ticketCount) external {
    require(date > block.timestamp, "an event can only be created at a future date");
    require(ticketCount > 0, "an event can only be created with 1 or more tickets");
    events[nextEventId] = Event(nextEventId, msg.sender, name, date, price, ticketCount, ticketCount);
    nextEventId++;
  }

  function buyTicket(uint eventId, uint quantity) payable external eventExist(eventId) eventActive(eventId) {
    Event storage _event = events[eventId];       
    require(_event.ticketRemaining >= quantity, "not enough tickets left");
    require(msg.value == (quantity * _event.price), "not enough ether sent");
    _event.ticketRemaining -= quantity;
    tickets[msg.sender][eventId] += quantity;
  }

  function transferTicket(uint eventId, uint quantity, address to) external eventExist(eventId) eventActive(eventId) {
    require(tickets[msg.sender][eventId] >= quantity, "not enough tickets");
    tickets[msg.sender][eventId] -= quantity;
    tickets[to][eventId] += quantity;
  }

  modifier eventExist(uint eventId) {
    require(events[eventId].date > 0, "event does not exist");
    _;
  }

  modifier eventActive(uint eventId) {
    require(block.timestamp < events[eventId].date, "event is not active anymore");
    _;
  }
}
