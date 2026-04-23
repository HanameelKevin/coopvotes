/**
 * Database Seeder for CoopVotes
 * Run with: npm run seed
 * Full dataset: all departments with candidates + pre-seeded votes so results/analytics show live data
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Election = require('../models/Election');
const Vote = require('../models/Vote');

dotenv.config();

// ─── USERS ───────────────────────────────────────────────────────────────────
const usersData = [
  // Admin
  { email: 'admin@student.cuk.ac.ke', regNumber: 'C032/000001/2024', department: 'ADMIN', yearOfStudy: 1, admissionYear: 2024, role: 'admin' },

  // IT – C prefix
  { email: 'john.bit@student.cuk.ac.ke',    regNumber: 'C026/405411/2023', department: 'BIT',   yearOfStudy: 2, admissionYear: 2023, role: 'student' },
  { email: 'jane.bit@student.cuk.ac.ke',    regNumber: 'C026/405412/2023', department: 'BIT',   yearOfStudy: 2, admissionYear: 2023, role: 'student' },
  { email: 'alice.bit@student.cuk.ac.ke',   regNumber: 'C026/405413/2022', department: 'BIT',   yearOfStudy: 3, admissionYear: 2022, role: 'aspirant' },
  { email: 'president@student.cuk.ac.ke',   regNumber: 'C026/405414/2021', department: 'BIT',   yearOfStudy: 4, admissionYear: 2021, role: 'aspirant' },
  { email: 'janet.bit@student.cuk.ac.ke',   regNumber: 'C026/405415/2021', department: 'BIT',   yearOfStudy: 4, admissionYear: 2021, role: 'aspirant' },

  // Business – B prefix
  { email: 'bob.bbm@student.cuk.ac.ke',     regNumber: 'B027/505411/2023', department: 'BBM',   yearOfStudy: 2, admissionYear: 2023, role: 'student' },
  { email: 'lorraine@student.cuk.ac.ke',    regNumber: 'B08/309433/2023',  department: 'BBM',   yearOfStudy: 2, admissionYear: 2023, role: 'student' },
  { email: 'carol.bbm@student.cuk.ac.ke',   regNumber: 'B027/505412/2023', department: 'BBM',   yearOfStudy: 2, admissionYear: 2023, role: 'aspirant' },
  { email: 'rachel.bbm@student.cuk.ac.ke',  regNumber: 'B027/505420/2021', department: 'BBM',   yearOfStudy: 4, admissionYear: 2021, role: 'aspirant' },

  // Computer Science – C prefix
  { email: 'dave.cs@student.cuk.ac.ke',     regNumber: 'C028/605411/2023', department: 'CS',    yearOfStudy: 2, admissionYear: 2023, role: 'student' },
  { email: 'eve.cs@student.cuk.ac.ke',      regNumber: 'C028/605412/2022', department: 'CS',    yearOfStudy: 3, admissionYear: 2022, role: 'aspirant' },
  { email: 'richard.cs@student.cuk.ac.ke',  regNumber: 'C028/605421/2021', department: 'CS',    yearOfStudy: 4, admissionYear: 2021, role: 'aspirant' },

  // Commerce – B prefix
  { email: 'charles.comm@student.cuk.ac.ke',regNumber: 'B029/705411/2023', department: 'COMM',  yearOfStudy: 2, admissionYear: 2023, role: 'student' },
  { email: 'henry.comm@student.cuk.ac.ke',  regNumber: 'B029/705415/2022', department: 'COMM',  yearOfStudy: 3, admissionYear: 2022, role: 'aspirant' },

  // Law – L prefix
  { email: 'leo.law@student.cuk.ac.ke',     regNumber: 'L030/805411/2023', department: 'LAW',   yearOfStudy: 2, admissionYear: 2023, role: 'student' },
  { email: 'oliver.law@student.cuk.ac.ke',  regNumber: 'L030/805415/2022', department: 'LAW',   yearOfStudy: 3, admissionYear: 2022, role: 'aspirant' },

  // Education – C prefix (existing)
  { email: 'peter.edu@student.cuk.ac.ke',   regNumber: 'C031/905411/2023', department: 'EDU',   yearOfStudy: 2, admissionYear: 2023, role: 'student' },
  { email: 'patricia.edu@student.cuk.ac.ke',regNumber: 'C031/905412/2022', department: 'EDU',   yearOfStudy: 3, admissionYear: 2022, role: 'aspirant' },

  // Maths – M prefix
  { email: 'mary.math@student.cuk.ac.ke',   regNumber: 'M001/100001/2023', department: 'MATHS', yearOfStudy: 2, admissionYear: 2023, role: 'student' },
  { email: 'mark.math@student.cuk.ac.ke',   regNumber: 'M001/100002/2023', department: 'MATHS', yearOfStudy: 2, admissionYear: 2023, role: 'aspirant' },

  // Catering – D prefix
  { email: 'dan.cater@student.cuk.ac.ke',   regNumber: 'D001/200001/2023', department: 'CATER', yearOfStudy: 2, admissionYear: 2023, role: 'student' },
  { email: 'doris.cater@student.cuk.ac.ke', regNumber: 'D001/200002/2023', department: 'CATER', yearOfStudy: 2, admissionYear: 2023, role: 'aspirant' },

  // Sciences – H prefix
  { email: 'harry.sci@student.cuk.ac.ke',   regNumber: 'H001/300001/2023', department: 'SCI',   yearOfStudy: 2, admissionYear: 2023, role: 'student' },
  { email: 'helen.sci@student.cuk.ac.ke',   regNumber: 'H001/300002/2023', department: 'SCI',   yearOfStudy: 2, admissionYear: 2023, role: 'aspirant' },
];

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ MongoDB Connected');
};

const seedDatabase = async () => {
  try {
    console.log('\nClearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Candidate.deleteMany({}),
      Election.deleteMany({}),
      Vote.deleteMany({})
    ]);
    console.log('✓ Cleared');

    // ── Create users (no password needed – login uses email + regNumber) ──
    console.log('\nInserting users...');
    const createdUsers = await User.insertMany(
      usersData.map(u => ({ ...u, hasVoted: false, votedPositions: [], isVerified: true }))
    );
    console.log(`✓ ${createdUsers.length} users`);

    const find = (email) => createdUsers.find(u => u.email === email);
    const adminUser = find('admin@student.cuk.ac.ke');

    // ── Election ──────────────────────────────────────────────────────────
    console.log('\nCreating election...');
    const studentCount = createdUsers.filter(u => u.role === 'student').length;
    const [election] = await Election.insertMany([{
      name: 'Student Government Election 2026',
      year: 2026,
      isActive: true,
      status: 'active',
      startTime: new Date(),
      totalVoters: studentCount,
      totalVotes: 0,
      positions: [
        { name: 'President',      department: null },
        { name: 'Congress Person', department: 'BIT' },
        { name: 'Congress Person', department: 'BBM' },
        { name: 'Congress Person', department: 'CS' },
        { name: 'Congress Person', department: 'COMM' },
        { name: 'Congress Person', department: 'LAW' },
        { name: 'Congress Person', department: 'EDU' },
        { name: 'Congress Person', department: 'MATHS' },
        { name: 'Congress Person', department: 'CATER' },
        { name: 'Congress Person', department: 'SCI' },
      ]
    }]);
    console.log(`✓ Election: ${election.name}`);

    // ── Candidates ────────────────────────────────────────────────────────
    console.log('\nCreating candidates...');
    const candidatesData = [
      // PRESIDENT (university-wide)
      { email: 'president@student.cuk.ac.ke', position: 'President', department: null,
        manifesto: 'Better facilities, faster WiFi, and student-first governance for all departments.',
        votes: 14, offlineVotes: 3 },
      { email: 'janet.bit@student.cuk.ac.ke',  position: 'President', department: null,
        manifesto: 'Accountability and transparency in every student council decision.',
        votes: 9, offlineVotes: 2 },
      { email: 'rachel.bbm@student.cuk.ac.ke', position: 'President', department: null,
        manifesto: 'Student welfare first — affordable accommodation and better meals.',
        votes: 7, offlineVotes: 1 },
      { email: 'richard.cs@student.cuk.ac.ke', position: 'President', department: null,
        manifesto: 'Innovation, inclusion, and integrity across every campus programme.',
        votes: 5, offlineVotes: 0 },

      // CONGRESS – one per dept
      { email: 'alice.bit@student.cuk.ac.ke',    position: 'Congress Person', department: 'BIT',
        manifesto: 'Better labs and industry connections for IT students.', votes: 8, offlineVotes: 1 },
      { email: 'carol.bbm@student.cuk.ac.ke',    position: 'Congress Person', department: 'BBM',
        manifesto: 'Real-world exposure and company visits for Business students.', votes: 6, offlineVotes: 2 },
      { email: 'eve.cs@student.cuk.ac.ke',       position: 'Congress Person', department: 'CS',
        manifesto: 'More hackathons and 24/7 lab access for CS students.', votes: 7, offlineVotes: 0 },
      { email: 'henry.comm@student.cuk.ac.ke',   position: 'Congress Person', department: 'COMM',
        manifesto: 'Better media labs and broadcast equipment for COMM students.', votes: 5, offlineVotes: 1 },
      { email: 'oliver.law@student.cuk.ac.ke',   position: 'Congress Person', department: 'LAW',
        manifesto: 'Better library resources and moot courts for Law students.', votes: 9, offlineVotes: 0 },
      { email: 'patricia.edu@student.cuk.ac.ke', position: 'Congress Person', department: 'EDU',
        manifesto: 'Better teaching resources and mentorship programmes.', votes: 4, offlineVotes: 2 },
      { email: 'mark.math@student.cuk.ac.ke',    position: 'Congress Person', department: 'MATHS',
        manifesto: 'Mathematics is the backbone. Better computing access for Maths students.', votes: 6, offlineVotes: 0 },
      { email: 'doris.cater@student.cuk.ac.ke',  position: 'Congress Person', department: 'CATER',
        manifesto: 'Modern kitchens and practical training sessions for Catering.', votes: 5, offlineVotes: 1 },
      { email: 'helen.sci@student.cuk.ac.ke',    position: 'Congress Person', department: 'SCI',
        manifesto: 'State-of-the-art labs and research funding for Sciences students.', votes: 7, offlineVotes: 2 },
    ];

    const createdCandidates = await Candidate.insertMany(
      candidatesData.map(c => ({
        userId: find(c.email)._id,
        position: c.position,
        department: c.department,
        manifesto: c.manifesto,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.email.split('@')[0]}`,
        votes: c.votes,
        offlineVotes: c.offlineVotes,
        isApproved: true,
        approvedBy: adminUser._id,
        approvedAt: new Date()
      }))
    );
    console.log(`✓ ${createdCandidates.length} candidates`);

    // ── Update candidate vote tallies & election stats so results show data ─
    console.log('\nUpdating vote tallies...');
    let totalVotes = 0;
    for (const c of createdCandidates) {
      totalVotes += (c.votes || 0) + (c.offlineVotes || 0);
    }
    await Election.findByIdAndUpdate(election._id, { totalVotes });

    // Mark aspirants who voted
    await User.updateMany(
      { role: 'student' },
      { $set: { hasVoted: true, votedPositions: ['President', 'Congress Person'] } }
    );
    console.log(`✓ Tallies updated — total votes: ${totalVotes}`);

    // ── Summary ───────────────────────────────────────────────────────────
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║      ✅ DATABASE SEEDED SUCCESSFULLY                   ║');
    console.log('╠═══════════════════════════════════════════════════════╣');
    console.log(`║  Users:      ${String(createdUsers.length).padEnd(40)}║`);
    console.log(`║  Candidates: ${String(createdCandidates.length).padEnd(40)}║`);
    console.log(`║  Votes:      ${String(totalVotes).padEnd(40)}║`);
    console.log('╠═══════════════════════════════════════════════════════╣');
    console.log('║  TEST LOGINS (use any @student.cuk.ac.ke email)       ║');
    console.log('║  Admin:     admin@student.cuk.ac.ke                   ║');
    console.log('║             C032/000001/2024                           ║');
    console.log('║  IT:        john.bit@student.cuk.ac.ke                ║');
    console.log('║             C026/405411/2023                           ║');
    console.log('║  Business:  lorraine@student.cuk.ac.ke                ║');
    console.log('║             B08/309433/2023                            ║');
    console.log('║  Law:       leo.law@student.cuk.ac.ke                 ║');
    console.log('║             L030/805411/2023                           ║');
    console.log('║  Maths:     mary.math@student.cuk.ac.ke               ║');
    console.log('║             M001/100001/2023                           ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('\n✨ Start the app: npm run dev\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed Error:', error.message || error);
    process.exit(1);
  }
};

connectDB().then(() => seedDatabase());
