import { NextRequest, NextResponse } from 'next/server';

export interface DiscoveredScannerDevice {
  ip: string;
  hostname: string;
  model: string;
  manufacturer: string;
  macAddress: string;
  latencyMs: number;
  status: 'ONLINE' | 'STANDBY' | 'BUSY';
  port: number;
  commandCenterUrl: string;
  isKyocera: boolean;
  locationTag: string;
  capabilities: {
    hasAdf: boolean;
    adfCapacity: number;
    maxSpeedPpm: number;
    maxDpi: number;
    duplexSupported: boolean;
    colorSupported: boolean;
    twainSupported: boolean;
    wsdSupported: boolean;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const subnet = (body.subnet || '192.168.1').trim().replace(/\.$/, '');
    const searchMode = body.searchMode || 'QUICK'; // 'QUICK' | 'DEEP' | 'CUSTOM'

    // Mock candidates or probes tailored to Indonesian school network infrastructure
    // (TU, Ruang Guru, Lab Komputer, Perpustakaan, Kepala Madrasah)
    const predefinedScanners: DiscoveredScannerDevice[] = [
      {
        ip: `${subnet}.185`,
        hostname: 'KYOCERA-M2535DN-TU',
        model: 'Kyocera ECOSYS M2535dn (Ruang TU / Admin)',
        manufacturer: 'Kyocera Document Solutions',
        macAddress: '00:17:C8:4B:2E:81',
        latencyMs: 4,
        status: 'ONLINE',
        port: 9010,
        commandCenterUrl: `http://${subnet}.185`,
        isKyocera: true,
        locationTag: 'Ruang Tata Usaha (Paling Rekomendasi)',
        capabilities: {
          hasAdf: true,
          adfCapacity: 50,
          maxSpeedPpm: 35,
          maxDpi: 400,
          duplexSupported: true,
          colorSupported: true,
          twainSupported: true,
          wsdSupported: true
        }
      },
      {
        ip: `${subnet}.200`,
        hostname: 'KYOCERA-M2535DN-GURU',
        model: 'Kyocera ECOSYS M2535dn (Ruang Guru / Kurikulum)',
        manufacturer: 'Kyocera Document Solutions',
        macAddress: '00:17:C8:9C:1A:44',
        latencyMs: 6,
        status: 'ONLINE',
        port: 9010,
        commandCenterUrl: `http://${subnet}.200`,
        isKyocera: true,
        locationTag: 'Ruang Guru / Tim Penilaian',
        capabilities: {
          hasAdf: true,
          adfCapacity: 50,
          maxSpeedPpm: 35,
          maxDpi: 400,
          duplexSupported: true,
          colorSupported: true,
          twainSupported: true,
          wsdSupported: true
        }
      },
      {
        ip: `${subnet}.50`,
        hostname: 'KYOCERA-TASKALFA-2554',
        model: 'Kyocera TASKalfa 2554ci Heavy Duty Scanner',
        manufacturer: 'Kyocera Document Solutions',
        macAddress: '00:17:C8:3F:88:12',
        latencyMs: 8,
        status: 'ONLINE',
        port: 9010,
        commandCenterUrl: `http://${subnet}.50`,
        isKyocera: true,
        locationTag: 'Pusat Penggandaan / Lab Komputer',
        capabilities: {
          hasAdf: true,
          adfCapacity: 140,
          maxSpeedPpm: 50,
          maxDpi: 600,
          duplexSupported: true,
          colorSupported: true,
          twainSupported: true,
          wsdSupported: true
        }
      }
    ];

    if (searchMode === 'DEEP') {
      // Add more scanner models found in deep scan
      predefinedScanners.push({
        ip: `${subnet}.202`,
        hostname: 'KYOCERA-M2040DN-PERPUS',
        model: 'Kyocera ECOSYS M2040dn (Perpustakaan)',
        manufacturer: 'Kyocera Document Solutions',
        macAddress: '00:17:C8:55:77:23',
        latencyMs: 12,
        status: 'STANDBY',
        port: 9010,
        commandCenterUrl: `http://${subnet}.202`,
        isKyocera: true,
        locationTag: 'Perpustakaan Madrasah/Sekolah',
        capabilities: {
          hasAdf: true,
          adfCapacity: 50,
          maxSpeedPpm: 40,
          maxDpi: 400,
          duplexSupported: true,
          colorSupported: false,
          twainSupported: true,
          wsdSupported: true
        }
      });
    }

    return NextResponse.json({
      subnet,
      searchMode,
      totalScannedIps: searchMode === 'DEEP' ? 254 : 64,
      foundCount: predefinedScanners.length,
      devices: predefinedScanners,
      scanTimestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || 'Gagal menjalankan pemindaian subnet IP scanner'
    }, { status: 500 });
  }
}
