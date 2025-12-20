export interface Journalist {
    id: string;
    fullname: string;
    country: string;
    passportNo: string;
    role: string;
    status: 'Approved' | 'Pending' | 'Rejected' | 'Entered';
    arrivalDate?: string;
    departureGate?: string;
    gender?: string;
    dob?: string;
    pob?: string;
    visaNumber?: string;
    visaType?: string;
    visaIssueDate?: string;
    visaExpiryDate?: string;
    accommodation?: string;
    contact?: string;
    photoUrl: string; // Placeholder
}

export const MOCK_JOURNALISTS: Journalist[] = [
    {
        id: '01',
        fullname: 'Anupam Adhikari',
        country: 'KE', // Kenya
        passportNo: 'A1234567',
        role: 'Cameraman',
        status: 'Approved',
        gender: 'FEMALE',
        dob: '12 May 1999',
        pob: '12 May 1999',
        visaNumber: 'ET-537-53',
        visaType: 'JV',
        visaIssueDate: '10 Jun 2014',
        visaExpiryDate: '11 Jun 2019',
        accommodation: 'Skylight Hotel',
        contact: '+255175568654',
        photoUrl: 'https://t3.ftcdn.net/jpg/02/79/78/48/360_F_279784836_4eKMjfIfDtaICKmaSBAyft2Y43u5V76Q.jpg'
    },
    {
        id: '02',
        fullname: 'Anupam Adhikari',
        country: 'NG', // Nigeria
        passportNo: 'K9876543',
        role: 'Editor',
        status: 'Pending',
        photoUrl: 'https://t3.ftcdn.net/jpg/02/79/78/48/360_F_279784836_4eKMjfIfDtaICKmaSBAyft2Y43u5V76Q.jpg'
    },
    {
        id: '03',
        fullname: 'Anupam Adhikari',
        country: 'CG', // Congo
        passportNo: 'C2345678',
        role: 'Journalist',
        status: 'Approved',
        photoUrl: 'https://t3.ftcdn.net/jpg/02/79/78/48/360_F_279784836_4eKMjfIfDtaICKmaSBAyft2Y43u5V76Q.jpg'
    },
    {
        id: '04',
        fullname: 'Anupam Adhikari',
        country: 'ZA', // South Africa
        passportNo: 'S7654321',
        role: 'Journalist',
        status: 'Rejected',
        photoUrl: 'https://t3.ftcdn.net/jpg/02/79/78/48/360_F_279784836_4eKMjfIfDtaICKmaSBAyft2Y43u5V76Q.jpg'
    },
    {
        id: '05',
        fullname: 'Anupam Adhikari',
        country: 'CN', // China
        passportNo: 'EJ1234567',
        role: 'Broadcast',
        status: 'Approved',
        photoUrl: 'https://t3.ftcdn.net/jpg/02/79/78/48/360_F_279784836_4eKMjfIfDtaICKmaSBAyft2Y43u5V76Q.jpg'
    },
    {
        id: '06',
        fullname: 'Kamal Adhikari',
        country: 'RU', // Russia
        passportNo: 'M6543210',
        role: 'Photographer',
        status: 'Approved',
        photoUrl: 'https://t3.ftcdn.net/jpg/02/79/78/48/360_F_279784836_4eKMjfIfDtaICKmaSBAyft2Y43u5V76Q.jpg'
    }
];

export const ACCREDITED_JOURNALISTS: Journalist[] = [
    {
        id: '01',
        fullname: 'Umesh Shrestha',
        country: 'KE',
        passportNo: 'A1234567',
        role: 'Cameraman',
        status: 'Entered',
        arrivalDate: '16Dec2025',
        departureGate: 'Gate 1',
        photoUrl: 'https://t3.ftcdn.net/jpg/02/79/78/48/360_F_279784836_4eKMjfIfDtaICKmaSBAyft2Y43u5V76Q.jpg'
    },
    {
        id: '02',
        fullname: 'Shyam Pradhan',
        country: 'NG',
        passportNo: 'K9876543',
        role: 'Editor',
        status: 'Entered',
        arrivalDate: '18Dec2025',
        departureGate: 'Gate 2',
        photoUrl: 'https://t3.ftcdn.net/jpg/02/79/78/48/360_F_279784836_4eKMjfIfDtaICKmaSBAyft2Y43u5V76Q.jpg'
    },
    // Add more as per screenshot if needed, but this is enough for demo
];
