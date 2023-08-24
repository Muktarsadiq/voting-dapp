const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
  let votingContract;
  let owner;
  let alice;
  let bob;

  before(async function () {
    const Voting = await ethers.getContractFactory("Voting");
    [owner, alice, bob] = await ethers.getSigners();

    const candidateNames = ["Candidate 1", "Candidate 2"];
    votingContract = await Voting.deploy(candidateNames, 60); // 60 minutes duration
    await votingContract.deployed();
  });

  it("should deploy with initial candidates and duration", async function () {
    const candidates = await votingContract.getAllVotesOfCandiates();
    expect(candidates.length).to.equal(2);

    const votingStatus = await votingContract.getVotingStatus();
    expect(votingStatus).to.equal(true);

    const remainingTime = await votingContract.getRemainingTime();
    expect(remainingTime).to.be.above(0);
  });

  it("should allow owner to add a new candidate", async function () {
    await votingContract.connect(owner).addCandidate("Candidate 3");
    const candidates = await votingContract.getAllVotesOfCandiates();
    expect(candidates.length).to.equal(3);
  });

  it("should allow users to vote for a candidate", async function () {
    await votingContract.connect(alice).vote(0);
    const candidates = await votingContract.getAllVotesOfCandiates();
    expect(candidates[0].voteCount).to.equal(1);
  });

  it("should not allow a user to vote twice", async function () {
    await expect(votingContract.connect(alice).vote(1)).to.be.revertedWith("You have already voted.");
  });

  it("should not allow voting after the end of the voting period", async function () {
    await ethers.provider.send("evm_increaseTime", [61 * 60]); // Move 61 minutes ahead
    await ethers.provider.send("evm_mine"); // Mine a block to apply the time change

    const votingStatus = await votingContract.getVotingStatus();
    expect(votingStatus).to.equal(false);

    await expect(votingContract.connect(bob).vote(0)).to.be.revertedWith("Voting has ended.");
  });

  it("should return correct remaining time", async function () {
    const remainingTime = await votingContract.getRemainingTime();
    expect(remainingTime).to.equal(0);
  });
});
