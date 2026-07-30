// src/app/sports/data/seed-data.ts

import { OrganizationModel } from '../../organizations/model/organization.model';
import { ParticipantModel } from '../../participants/model/participant.model';
import { SportModel } from '../models/sport.model';

function generateId(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(3, '0')}`;
}

function makeDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString();
}

// Helper to generate a participant list with given count
function generateParticipants(prefix: string, startIndex: number, count: number): ParticipantModel[] {
  const participants: ParticipantModel[] = [];
  for (let i = 0; i < count; i++) {
    participants.push({
      id: generateId(prefix, startIndex + i),
      name: `Participant ${startIndex + i + 1}`,
    });
  }
  return participants;
}

function generateOrganizations(
  orgPrefix: string,
  orgStartIndex: number,
  partPrefix: string,
  partStartIndex: number,
  orgNames: string[],
  participantCounts: number[]
): OrganizationModel[] {
  const orgs: OrganizationModel[] = [];
  let partIndex = partStartIndex;
  for (let i = 0; i < orgNames.length; i++) {
    const orgId = generateId(orgPrefix, orgStartIndex + i);
    const participantCount = participantCounts[i];
    const participants = generateParticipants(partPrefix, partIndex, participantCount);
    partIndex += participantCount;
    orgs.push({
      id: orgId,
      name: orgNames[i],
      participants,
      createdAt: makeDate(60 + i * 5),
      updatedAt: makeDate(20 + i * 3),
      onboardedAt: makeDate(20 + i * 3),
    });
  }
  return orgs;
}

export const SEED_DATA: SportModel[] = [
  {
    id: generateId('sport', 1),
    name: 'Football',
    emoji: '⚽',
    color: '#2ED368',
    createdAt: makeDate(472),
    updatedAt: makeDate(79),
    governingBodies: [
      {
        id: generateId('gb', 1),
        name: 'FIFA',
        logo: '🟦',
        createdAt: makeDate(447),
        updatedAt: makeDate(73),
        organizations: generateOrganizations(
          'org', 1, 'part', 1,
          ['FIFA Club World Cup', 'FIFA World Cup Organizing Committee', 'FIFA Development'],
          [80, 70, 50] // participants per org -> total 200
        ),
      },
      {
        id: generateId('gb', 2),
        name: 'UEFA',
        logo: '🟧',
        createdAt: makeDate(400),
        updatedAt: makeDate(60),
        organizations: generateOrganizations(
          'org', 4, 'part', 201,
          ['UEFA Champions League', 'UEFA Europa League', 'UEFA Nations League'],
          [60, 50, 40] // total 150
        ),
      },
      {
        id: generateId('gb', 3),
        name: 'CONMEBOL',
        logo: '🟩',
        createdAt: makeDate(380),
        updatedAt: makeDate(55),
        organizations: generateOrganizations(
          'org', 7, 'part', 351,
          ['Copa Libertadores', 'Copa Sudamericana'],
          [60, 40] // total 100
        ),
      },
    ],
  },
  {
    id: generateId('sport', 2),
    name: 'Basketball',
    emoji: '🏀',
    color: '#FFB414',
    createdAt: makeDate(450),
    updatedAt: makeDate(80),
    governingBodies: [
      {
        id: generateId('gb', 4),
        name: 'FIBA',
        logo: '🏀',
        createdAt: makeDate(420),
        updatedAt: makeDate(70),
        organizations: generateOrganizations(
          'org', 9, 'part', 401,
          ['FIBA World Cup', 'FIBA Americas', 'FIBA Europe'],
          [80, 60, 50] // total 190
        ),
      },
      {
        id: generateId('gb', 5),
        name: 'EuroLeague',
        logo: '🇪🇺',
        createdAt: makeDate(400),
        updatedAt: makeDate(60),
        organizations: generateOrganizations(
          'org', 12, 'part', 591,
          ['EuroLeague Basketball', 'EuroCup'],
          [80, 50] // total 130
        ),
      },
    ],
  },
  {
    id: generateId('sport', 3),
    name: 'Baseball',
    emoji: '⚾',
    color: '#EC193C',
    createdAt: makeDate(440),
    updatedAt: makeDate(75),
    governingBodies: [
      {
        id: generateId('gb', 6),
        name: 'WBSC',
        logo: '⚾',
        createdAt: makeDate(410),
        updatedAt: makeDate(66),
        organizations: generateOrganizations(
          'org', 14, 'part', 701,
          ['WBSC Premier12', 'WBSC U-23 World Cup'],
          [60, 40] // total 100
        ),
      },
      {
        id: generateId('gb', 7),
        name: 'MLB',
        logo: '🇺🇸',
        createdAt: makeDate(390),
        updatedAt: makeDate(55),
        organizations: generateOrganizations(
          'org', 16, 'part', 801,
          ['Major League Baseball', 'Minor League Baseball'],
          [50, 30] // total 80
        ),
      },
    ],
  },
  {
    id: generateId('sport', 4),
    name: 'Hockey',
    emoji: '🏒',
    color: '#212121',
    createdAt: makeDate(430),
    updatedAt: makeDate(70),
    governingBodies: [
      {
        id: generateId('gb', 8),
        name: 'IIHF',
        logo: '🏒',
        createdAt: makeDate(400),
        updatedAt: makeDate(58),
        organizations: generateOrganizations(
          'org', 18, 'part', 901,
          ['IIHF World Championship', 'IIHF World Junior Championship'],
          [50, 40] // total 90
        ),
      },
      {
        id: generateId('gb', 9),
        name: 'NHL',
        logo: '🇨🇦',
        createdAt: makeDate(380),
        updatedAt: makeDate(50),
        organizations: generateOrganizations(
          'org', 20, 'part', 991,
          ['National Hockey League', 'AHL'],
          [40, 20] // total 60
        ),
      },
    ],
  },
  {
    id: generateId('sport', 5),
    name: 'Tennis',
    emoji: '🎾',
    color: '#FFB414',
    createdAt: makeDate(420),
    updatedAt: makeDate(65),
    governingBodies: [
      {
        id: generateId('gb', 10),
        name: 'ITF',
        logo: '🎾',
        createdAt: makeDate(390),
        updatedAt: makeDate(55),
        organizations: generateOrganizations(
          'org', 22, 'part', 1051,
          ['ITF World Tennis Tour', 'Davis Cup'],
          [40, 30] // total 70
        ),
      },
      {
        id: generateId('gb', 11),
        name: 'ATP',
        logo: '🏆',
        createdAt: makeDate(370),
        updatedAt: makeDate(48),
        organizations: generateOrganizations(
          'org', 24, 'part', 1121,
          ['ATP Tour', 'ATP Challenger Tour'],
          [30, 20] // total 50
        ),
      },
    ],
  },
  {
    id: generateId('sport', 6),
    name: 'Rugby',
    emoji: '🏉',
    color: '#2ED368',
    createdAt: makeDate(410),
    updatedAt: makeDate(60),
    governingBodies: [
      {
        id: generateId('gb', 12),
        name: 'World Rugby',
        logo: '🏉',
        createdAt: makeDate(380),
        updatedAt: makeDate(50),
        organizations: generateOrganizations(
          'org', 26, 'part', 1171,
          ['Rugby World Cup', 'World Rugby Sevens Series'],
          [40, 30] // total 70
        ),
      },
      {
        id: generateId('gb', 13),
        name: 'Six Nations',
        logo: '🏆',
        createdAt: makeDate(360),
        updatedAt: makeDate(42),
        organizations: generateOrganizations(
          'org', 28, 'part', 1241,
          ['Six Nations Championship'],
          [20] // total 20
        ),
      },
    ],
  },
  {
    id: generateId('sport', 7),
    name: 'Volleyball',
    emoji: '🏐',
    color: '#EC193C',
    createdAt: makeDate(400),
    updatedAt: makeDate(55),
    governingBodies: [
      {
        id: generateId('gb', 14),
        name: 'FIVB',
        logo: '🏐',
        createdAt: makeDate(370),
        updatedAt: makeDate(48),
        organizations: generateOrganizations(
          'org', 29, 'part', 1261,
          ['FIVB Volleyball Nations League', 'FIVB World Championship'],
          [35, 25] // total 60
        ),
      },
    ],
  },
  {
    id: generateId('sport', 8),
    name: 'MMA',
    emoji: '🥊',
    color: '#FFB414',
    createdAt: makeDate(390),
    updatedAt: makeDate(50),
    governingBodies: [
      {
        id: generateId('gb', 15),
        name: 'UFC',
        logo: '🥊',
        createdAt: makeDate(360),
        updatedAt: makeDate(42),
        organizations: generateOrganizations(
          'org', 31, 'part', 1321,
          ['UFC Fight Night', 'UFC PPV Events'],
          [30, 25] // total 55
        ),
      },
      {
        id: generateId('gb', 16),
        name: 'Bellator',
        logo: '🔔',
        createdAt: makeDate(340),
        updatedAt: makeDate(35),
        organizations: generateOrganizations(
          'org', 33, 'part', 1376,
          ['Bellator MMA', 'Bellator Champions Series'],
          [25, 20] // total 45
        ),
      },
    ],
  },
  {
    id: generateId('sport', 9),
    name: 'Snowboarding',
    emoji: '🏂',
    color: '#212121',
    createdAt: makeDate(380),
    updatedAt: makeDate(45),
    governingBodies: [
      {
        id: generateId('gb', 17),
        name: 'FIS',
        logo: '🏂',
        createdAt: makeDate(350),
        updatedAt: makeDate(38),
        organizations: generateOrganizations(
          'org', 35, 'part', 1421,
          ['FIS Snowboard World Cup'],
          [30] // total 30
        ),
      },
    ],
  },
  {
    id: generateId('sport', 10),
    name: 'Boxing',
    emoji: '🥊',
    color: '#2ED368',
    createdAt: makeDate(370),
    updatedAt: makeDate(40),
    governingBodies: [
      {
        id: generateId('gb', 18),
        name: 'WBC',
        logo: '🥊',
        createdAt: makeDate(340),
        updatedAt: makeDate(32),
        organizations: generateOrganizations(
          'org', 36, 'part', 1451,
          ['WBC World Title', 'WBC Silver'],
          [20, 15] // total 35
        ),
      },
      {
        id: generateId('gb', 19),
        name: 'WBA',
        logo: '🥊',
        createdAt: makeDate(330),
        updatedAt: makeDate(28),
        organizations: generateOrganizations(
          'org', 38, 'part', 1486,
          ['WBA World Championship', 'WBA International'],
          [15, 15] // total 30
        ),
      },
      {
        id: generateId('gb', 20),
        name: 'IBF',
        logo: '🥊',
        createdAt: makeDate(320),
        updatedAt: makeDate(25),
        organizations: generateOrganizations(
          'org', 40, 'part', 1516,
          ['IBF World Title'],
          [15] // total 15
        ),
      },
    ],
  },
];