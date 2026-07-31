// src/app/sports/data/seed-data.ts

import { OrganizationModel } from '../../organizations/model/organization.model';
import { ParticipantModel } from '../../participants/model/participant.model';
import { SportModel } from '../../sports/models/sport.model';

function generateId(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(3, '0')}`;
}

// Returns a Date object – used for OrganizationModel timestamps
function makeDate(offsetDays: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d;
}

// Returns an ISO string – used for SportModel & EntityModel timestamps
function makeDateString(offsetDays: number): string {
  return makeDate(offsetDays).toISOString();
}

// Helper to generate a participant list with given count
function generateParticipants(
  prefix: string,
  startIndex: number,
  count: number
): ParticipantModel[] {
  const participants: ParticipantModel[] = [];
  for (let i = 0; i < count; i++) {
    const id = generateId(prefix, startIndex + i);
    participants.push({
      id,
      name: `Participant ${startIndex + i + 1}`,
      logo: `https://picsum.photos/seed/${id}/50/50`,
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
      logo: `https://picsum.photos/seed/${orgId}/100/100`,
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
    createdAt: makeDateString(472),
    updatedAt: makeDateString(79),
    entities: [
      {
        id: generateId('gb', 1),
        name: 'FIFA',
        logo: '🟦',
        createdAt: makeDateString(447),
        updatedAt: makeDateString(73),
        onboardedAt: makeDateString(73),
        organizations: generateOrganizations(
          'org', 1, 'part', 1,
          ['FIFA Club World Cup', 'FIFA World Cup Organizing Committee', 'FIFA Development'],
          [80, 70, 50]
        ),
      },
      {
        id: generateId('gb', 2),
        name: 'UEFA',
        logo: '🟧',
        createdAt: makeDateString(400),
        updatedAt: makeDateString(60),
        onboardedAt: makeDateString(60),
        organizations: generateOrganizations(
          'org', 4, 'part', 201,
          ['UEFA Champions League', 'UEFA Europa League', 'UEFA Nations League'],
          [60, 50, 40]
        ),
      },
      {
        id: generateId('gb', 3),
        name: 'CONMEBOL',
        logo: '🟩',
        createdAt: makeDateString(380),
        updatedAt: makeDateString(55),
        onboardedAt: makeDateString(55),
        organizations: generateOrganizations(
          'org', 7, 'part', 351,
          ['Copa Libertadores', 'Copa Sudamericana'],
          [60, 40]
        ),
      },
    ],
  },
  {
    id: generateId('sport', 2),
    name: 'Basketball',
    emoji: '🏀',
    color: '#FFB414',
    createdAt: makeDateString(450),
    updatedAt: makeDateString(80),
    entities: [
      {
        id: generateId('gb', 4),
        name: 'FIBA',
        logo: '🏀',
        createdAt: makeDateString(420),
        updatedAt: makeDateString(70),
        onboardedAt: makeDateString(70),
        organizations: generateOrganizations(
          'org', 9, 'part', 401,
          ['FIBA World Cup', 'FIBA Americas', 'FIBA Europe'],
          [80, 60, 50]
        ),
      },
      {
        id: generateId('gb', 5),
        name: 'EuroLeague',
        logo: '🇪🇺',
        createdAt: makeDateString(400),
        updatedAt: makeDateString(60),
        onboardedAt: makeDateString(60),
        organizations: generateOrganizations(
          'org', 12, 'part', 591,
          ['EuroLeague Basketball', 'EuroCup'],
          [80, 50]
        ),
      },
    ],
  },
  {
    id: generateId('sport', 3),
    name: 'Baseball',
    emoji: '⚾',
    color: '#EC193C',
    createdAt: makeDateString(440),
    updatedAt: makeDateString(75),
    entities: [
      {
        id: generateId('gb', 6),
        name: 'WBSC',
        logo: '⚾',
        createdAt: makeDateString(410),
        updatedAt: makeDateString(66),
        onboardedAt: makeDateString(66),
        organizations: generateOrganizations(
          'org', 14, 'part', 701,
          ['WBSC Premier12', 'WBSC U-23 World Cup'],
          [60, 40]
        ),
      },
      {
        id: generateId('gb', 7),
        name: 'MLB',
        logo: '🇺🇸',
        createdAt: makeDateString(390),
        updatedAt: makeDateString(55),
        onboardedAt: makeDateString(55),
        organizations: generateOrganizations(
          'org', 16, 'part', 801,
          ['Major League Baseball', 'Minor League Baseball'],
          [50, 30]
        ),
      },
    ],
  },
  {
    id: generateId('sport', 4),
    name: 'Hockey',
    emoji: '🏒',
    color: '#212121',
    createdAt: makeDateString(430),
    updatedAt: makeDateString(70),
    entities: [
      {
        id: generateId('gb', 8),
        name: 'IIHF',
        logo: '🏒',
        createdAt: makeDateString(400),
        updatedAt: makeDateString(58),
        onboardedAt: makeDateString(58),
        organizations: generateOrganizations(
          'org', 18, 'part', 901,
          ['IIHF World Championship', 'IIHF World Junior Championship'],
          [50, 40]
        ),
      },
      {
        id: generateId('gb', 9),
        name: 'NHL',
        logo: '🇨🇦',
        createdAt: makeDateString(380),
        updatedAt: makeDateString(50),
        onboardedAt: makeDateString(50),
        organizations: generateOrganizations(
          'org', 20, 'part', 991,
          ['National Hockey League', 'AHL'],
          [40, 20]
        ),
      },
    ],
  },
  {
    id: generateId('sport', 5),
    name: 'Tennis',
    emoji: '🎾',
    color: '#FFB414',
    createdAt: makeDateString(420),
    updatedAt: makeDateString(65),
    entities: [
      {
        id: generateId('gb', 10),
        name: 'ITF',
        logo: '🎾',
        createdAt: makeDateString(390),
        updatedAt: makeDateString(55),
        onboardedAt: makeDateString(55),
        organizations: generateOrganizations(
          'org', 22, 'part', 1051,
          ['ITF World Tennis Tour', 'Davis Cup'],
          [40, 30]
        ),
      },
      {
        id: generateId('gb', 11),
        name: 'ATP',
        logo: '🏆',
        createdAt: makeDateString(370),
        updatedAt: makeDateString(48),
        onboardedAt: makeDateString(48),
        organizations: generateOrganizations(
          'org', 24, 'part', 1121,
          ['ATP Tour', 'ATP Challenger Tour'],
          [30, 20]
        ),
      },
    ],
  },
  {
    id: generateId('sport', 6),
    name: 'Rugby',
    emoji: '🏉',
    color: '#2ED368',
    createdAt: makeDateString(410),
    updatedAt: makeDateString(60),
    entities: [
      {
        id: generateId('gb', 12),
        name: 'World Rugby',
        logo: '🏉',
        createdAt: makeDateString(380),
        updatedAt: makeDateString(50),
        onboardedAt: makeDateString(50),
        organizations: generateOrganizations(
          'org', 26, 'part', 1171,
          ['Rugby World Cup', 'World Rugby Sevens Series'],
          [40, 30]
        ),
      },
      {
        id: generateId('gb', 13),
        name: 'Six Nations',
        logo: '🏆',
        createdAt: makeDateString(360),
        updatedAt: makeDateString(42),
        onboardedAt: makeDateString(42),
        organizations: generateOrganizations(
          'org', 28, 'part', 1241,
          ['Six Nations Championship'],
          [20]
        ),
      },
    ],
  },
  {
    id: generateId('sport', 7),
    name: 'Volleyball',
    emoji: '🏐',
    color: '#EC193C',
    createdAt: makeDateString(400),
    updatedAt: makeDateString(55),
    entities: [
      {
        id: generateId('gb', 14),
        name: 'FIVB',
        logo: '🏐',
        createdAt: makeDateString(370),
        updatedAt: makeDateString(48),
        onboardedAt: makeDateString(48),
        organizations: generateOrganizations(
          'org', 29, 'part', 1261,
          ['FIVB Volleyball Nations League', 'FIVB World Championship'],
          [35, 25]
        ),
      },
    ],
  },
  {
    id: generateId('sport', 8),
    name: 'MMA',
    emoji: '🥊',
    color: '#FFB414',
    createdAt: makeDateString(390),
    updatedAt: makeDateString(50),
    entities: [
      {
        id: generateId('gb', 15),
        name: 'UFC',
        logo: '🥊',
        createdAt: makeDateString(360),
        updatedAt: makeDateString(42),
        onboardedAt: makeDateString(42),
        organizations: generateOrganizations(
          'org', 31, 'part', 1321,
          ['UFC Fight Night', 'UFC PPV Events'],
          [30, 25]
        ),
      },
      {
        id: generateId('gb', 16),
        name: 'Bellator',
        logo: '🔔',
        createdAt: makeDateString(340),
        updatedAt: makeDateString(35),
        onboardedAt: makeDateString(35),
        organizations: generateOrganizations(
          'org', 33, 'part', 1376,
          ['Bellator MMA', 'Bellator Champions Series'],
          [25, 20]
        ),
      },
    ],
  },
  {
    id: generateId('sport', 9),
    name: 'Snowboarding',
    emoji: '🏂',
    color: '#212121',
    createdAt: makeDateString(380),
    updatedAt: makeDateString(45),
    entities: [
      {
        id: generateId('gb', 17),
        name: 'FIS',
        logo: '🏂',
        createdAt: makeDateString(350),
        updatedAt: makeDateString(38),
        onboardedAt: makeDateString(38),
        organizations: generateOrganizations(
          'org', 35, 'part', 1421,
          ['FIS Snowboard World Cup'],
          [30]
        ),
      },
    ],
  },
  {
    id: generateId('sport', 10),
    name: 'Boxing',
    emoji: '🥊',
    color: '#2ED368',
    createdAt: makeDateString(370),
    updatedAt: makeDateString(40),
    entities: [
      {
        id: generateId('gb', 18),
        name: 'WBC',
        logo: '🥊',
        createdAt: makeDateString(340),
        updatedAt: makeDateString(32),
        onboardedAt: makeDateString(32),
        organizations: generateOrganizations(
          'org', 36, 'part', 1451,
          ['WBC World Title', 'WBC Silver'],
          [20, 15]
        ),
      },
      {
        id: generateId('gb', 19),
        name: 'WBA',
        logo: '🥊',
        createdAt: makeDateString(330),
        updatedAt: makeDateString(28),
        onboardedAt: makeDateString(28),
        organizations: generateOrganizations(
          'org', 38, 'part', 1486,
          ['WBA World Championship', 'WBA International'],
          [15, 15]
        ),
      },
      {
        id: generateId('gb', 20),
        name: 'IBF',
        logo: '🥊',
        createdAt: makeDateString(320),
        updatedAt: makeDateString(25),
        onboardedAt: makeDateString(25),
        organizations: generateOrganizations(
          'org', 40, 'part', 1516,
          ['IBF World Title'],
          [15]
        ),
      },
    ],
  },
];