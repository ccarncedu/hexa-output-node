const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'Rastreador_Pacotes_Recebidos.log');

const hexToDecimal = (hex) => parseInt(hex, 16);

const parseCoordinate = (hex) => hex ? (hexToDecimal(hex) / 1800000).toFixed(6) : "N/A";

const alarmCodes = {
    "00": "normal",
    "01": "sos",
    "02": "power_cut_alarm",
    "03": "vibration_alarm",
    "04": "enter_fence_alarm",
    "FE": "acc_on",
    "FF": "acc_off"
};

const processLogFile = (filePath) => {
    try {
        const logData = fs.readFileSync(filePath, 'utf8');
        const packets = logData.split('\n').map(line => line.trim()).filter(line => line);
        
        const processedPackets = packets.map(packet => parsePacket(packet)).filter(p => p !== null);
        
        fs.writeFileSync('output.json', JSON.stringify(processedPackets, null, 4));
        console.log('JSON gerado com sucesso! Verifique output.json');
    } catch (error) {
        console.error('Erro ao processar o arquivo:', error);
    }
};

const parsePacket = (packet) => {
    const data = packet.replace(/\s+/g, '');
    if (!data.startsWith('7878')) return null; 
    
    const protocolNumber = data.slice(6, 8);
    const isLocationPacket = protocolNumber === '12';
    const isLoginPacket = protocolNumber === '01';
    const isHeartbeatPacket = protocolNumber === '13';
    const isAlarmPacket = protocolNumber === '16';
    
    return {
        gps: isLocationPacket ? (data.slice(14, 16) !== '00' ? 'F' : 'A') : "N/A",
        latitude: isLocationPacket ? parseCoordinate(data.slice(18, 26)) : "N/A",
        longitude: isLocationPacket ? parseCoordinate(data.slice(26, 34)) : "N/A",
        latitudeHemisferio: isLocationPacket ? ((parseInt(data.slice(34, 36), 16) & 0x02) ? 'N' : 'S') : "N/A",
        longitudeHemisferio: isLocationPacket ? ((parseInt(data.slice(34, 36), 16) & 0x08) ? 'E' : 'W') : "N/A",
        speed: isLocationPacket ? hexToDecimal(data.slice(36, 38)) : "N/A",
        data: isLocationPacket ? `20${hexToDecimal(data.slice(8, 10))}-${hexToDecimal(data.slice(10, 12))}-${hexToDecimal(data.slice(12, 14))} ` +
              `${hexToDecimal(data.slice(14, 16))}:${hexToDecimal(data.slice(16, 18))}:${hexToDecimal(data.slice(18, 20))}` : "N/A",
        alarm: isAlarmPacket ? (alarmCodes[data.slice(8, 10)] || "tracker") : "N/A",
        acc: isLocationPacket ? ((parseInt(data.slice(34, 36), 16) & 0x02) ? 'on' : 'off') : "N/A",
        direcao: isLocationPacket ? hexToDecimal(data.slice(38, 42)) : "N/A",
        nivelBateria: isHeartbeatPacket ? `${hexToDecimal(data.slice(8, 10)) * 20}%` : "N/A",
        imei: isLoginPacket ? data.slice(8, 24) : "N/A",
        serialNumber: isLoginPacket ? data.slice(24, 28) : "N/A",
        crc: isLoginPacket ? data.slice(28, 32) : "N/A"
    };
};

processLogFile(logFilePath);


