require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

// Gender-matched Unsplash doctor avatars
const DOCTOR_DATA = [
  {
    name: 'Dr. Aisha Khan',
    email: 'doctor1@healthflow.app',
    phone: '9000000010',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=faces&q=80', // female ✓
    specialization: 'General Physician',
    consultationFee: 500,
    yearsOfExperience: 5,
    bio: 'Experienced General Physician dedicated to comprehensive patient care.',
    rating: { average: 4.8, count: 60 },
  },
  {
    name: 'Dr. Rohan Mehta',
    email: 'doctor2@healthflow.app',
    phone: '9000000011',
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=faces&q=80', // male ✓
    specialization: 'Cardiologist',
    consultationFee: 800,
    yearsOfExperience: 10,
    bio: 'Specialist in advanced cardiac care and echocardiography.',
    rating: { average: 4.9, count: 120 },
  },
  {
    name: 'Dr. Priya Nair',
    email: 'doctor3@healthflow.app',
    phone: '9000000012',
    avatarUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&h=300&fit=crop&crop=faces&q=80', // female ✓
    specialization: 'Dermatologist',
    consultationFee: 600,
    yearsOfExperience: 7,
    bio: 'Expert in clinical dermatology and aesthetic skin treatments.',
    rating: { average: 4.7, count: 85 },
  },
  {
    name: 'Dr. Arjun Rao',
    email: 'doctor4@healthflow.app',
    phone: '9000000013',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop&crop=faces&q=80', // male ✓
    specialization: 'Pediatrician',
    consultationFee: 550,
    yearsOfExperience: 8,
    bio: 'Dedicated pediatric specialist providing comprehensive child healthcare.',
    rating: { average: 4.8, count: 95 },
  },
  {
    name: 'Dr. Sneha Patil',
    email: 'doctor5@healthflow.app',
    phone: '9000000014',
    avatarUrl: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&h=300&fit=crop&crop=faces&q=80', // female ✓
    specialization: 'Orthopedic',
    consultationFee: 900,
    yearsOfExperience: 9,
    bio: 'Specializes in joint replacement and sports injury rehabilitation.',
    rating: { average: 4.6, count: 70 },
  },
  {
    name: 'Dr. Vikram Singh',
    email: 'doctor6@healthflow.app',
    phone: '9000000015',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=300&fit=crop&crop=faces&q=80', // male ✓
    specialization: 'Gynecologist',
    consultationFee: 700,
    yearsOfExperience: 12,
    bio: 'Comprehensive women\'s healthcare specialist with 12 years of experience.',
    rating: { average: 4.9, count: 110 },
  },
];

const PATIENT_DATA = [
  { name: 'Rahul Sharma', email: 'patient1@healthflow.app', phone: '8000000010', dob: new Date('1995-03-15'), gender: 'male', bloodGroup: 'O+' },
  { name: 'Priya Verma', email: 'patient2@healthflow.app', phone: '8000000011', dob: new Date('1992-07-22'), gender: 'female', bloodGroup: 'B+' },
  { name: 'Amit Patel', email: 'patient3@healthflow.app', phone: '8000000012', dob: new Date('1988-11-08'), gender: 'male', bloodGroup: 'A+' },
  { name: 'Neha Joshi', email: 'patient4@healthflow.app', phone: '8000000013', dob: new Date('1998-05-30'), gender: 'female', bloodGroup: 'AB+' },
  { name: 'Karan Malhotra', email: 'patient5@healthflow.app', phone: '8000000014', dob: new Date('1990-09-12'), gender: 'male', bloodGroup: 'O-' },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysAhead(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function seed() {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    Doctor.deleteMany({}),
    Appointment.deleteMany({}),
  ]);

  // Admin
  console.log('Creating admin...');
  await User.create({
    name: 'HealthFlow Admin',
    email: 'admin@healthflow.app',
    password: 'Admin@12345',
    role: 'admin',
    isEmailVerified: true,
  });

  // Doctors
  console.log('Creating doctors...');
  const doctorDocs = [];
  for (const d of DOCTOR_DATA) {
    const user = await User.create({
      name: d.name,
      email: d.email,
      password: 'Doctor@12345',
      role: 'doctor',
      phone: d.phone,
      avatarUrl: d.avatarUrl,
      isEmailVerified: true,
    });
    const doc = await Doctor.create({
      user: user._id,
      specialization: d.specialization,
      qualifications: ['MBBS', 'MD'],
      yearsOfExperience: d.yearsOfExperience,
      consultationFee: d.consultationFee,
      bio: d.bio,
      isVerified: true,
      isAcceptingAppointments: true,
      languagesSpoken: ['English', 'Hindi'],
      availability: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
        { dayOfWeek: 5, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30 },
      ],
      rating: d.rating,
    });
    doctorDocs.push({ user, doc });
  }

  // Patients
  console.log('Creating patients...');
  const patientDocs = [];
  for (const p of PATIENT_DATA) {
    const user = await User.create({
      name: p.name,
      email: p.email,
      password: 'Patient@12345',
      role: 'patient',
      phone: p.phone,
      isEmailVerified: true,
    });
    const patient = await Patient.create({
      user: user._id,
      dateOfBirth: p.dob,
      gender: p.gender,
      bloodGroup: p.bloodGroup,
    });
    patientDocs.push({ user, patient });
  }

  // Sample appointments — mix of past completed, upcoming confirmed, pending
  console.log('Creating sample appointments...');
  const apptSamples = [
    // Past completed
    { patientIdx: 0, doctorIdx: 0, date: daysAgo(10), start: '10:00', end: '10:30', status: 'completed', reason: 'Routine checkup' },
    { patientIdx: 1, doctorIdx: 1, date: daysAgo(7), start: '11:00', end: '11:30', status: 'completed', reason: 'Chest pain evaluation' },
    { patientIdx: 2, doctorIdx: 2, date: daysAgo(5), start: '14:00', end: '14:30', status: 'completed', reason: 'Skin rash consultation' },
    { patientIdx: 3, doctorIdx: 3, date: daysAgo(3), start: '09:30', end: '10:00', status: 'completed', reason: 'Child fever follow-up' },
    // Upcoming confirmed
    { patientIdx: 0, doctorIdx: 1, date: daysAhead(1), start: '10:00', end: '10:30', status: 'confirmed', reason: 'Annual heart checkup' },
    { patientIdx: 1, doctorIdx: 2, date: daysAhead(2), start: '11:30', end: '12:00', status: 'confirmed', reason: 'Acne treatment follow-up' },
    { patientIdx: 2, doctorIdx: 4, date: daysAhead(3), start: '15:00', end: '15:30', status: 'confirmed', reason: 'Knee pain assessment' },
    { patientIdx: 4, doctorIdx: 0, date: daysAhead(4), start: '09:00', end: '09:30', status: 'confirmed', reason: 'General consultation' },
    // Pending payment
    { patientIdx: 3, doctorIdx: 5, date: daysAhead(5), start: '14:30', end: '15:00', status: 'pending_payment', reason: 'Gynecology consultation' },
    { patientIdx: 4, doctorIdx: 3, date: daysAhead(6), start: '10:30', end: '11:00', status: 'pending_payment', reason: 'Pediatric checkup' },
    // Cancelled
    { patientIdx: 0, doctorIdx: 3, date: daysAgo(2), start: '13:00', end: '13:30', status: 'cancelled', reason: 'Child vaccination' },
  ];

  for (const a of apptSamples) {
    const { patient } = patientDocs[a.patientIdx];
    const { doc } = doctorDocs[a.doctorIdx];
    await Appointment.create({
      patient: patient._id,
      doctor: doc._id,
      date: a.date,
      startTime: a.start,
      endTime: a.end,
      status: a.status,
      reasonForVisit: a.reason,
      consultationFeeSnapshot: doc.consultationFee || 500,
      type: 'in_person',
    });
  }

  console.log('\n✅ Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin:   admin@healthflow.app    / Admin@12345');
  console.log('  Doctors: doctor1@healthflow.app  / Doctor@12345');
  console.log('           doctor2@healthflow.app  / Doctor@12345');
  console.log('           (doctor3 - doctor6 same password)');
  console.log('  Patients: patient1@healthflow.app / Patient@12345');
  console.log('            patient2@healthflow.app / Patient@12345');
  console.log('            (patient3 - patient5 same password)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Created: ${DOCTOR_DATA.length} doctors, ${PATIENT_DATA.length} patients, ${apptSamples.length} appointments\n`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
