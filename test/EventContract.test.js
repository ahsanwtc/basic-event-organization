const EventContract = artifacts.require("EventContract");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("EventContract", function (/* accounts */) {
  it("should assert true", async function () {
    await EventContract.deployed();
    return assert.isTrue(true);
  });
});
