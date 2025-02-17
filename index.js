const fs = require('fs');

const alarmCodes = {
    "00": "normal",
    "01": "sos",
    "02": "power_cut_alarm",
    "03": "vibration_alarm",
    "04": "enter_fence_alarm",
    "FE": "accon",
    "FF": "accoff"
};

function parseTrackerLog(logContent) {
    const lines = logContent.split('\n').map(line => line.trim()).filter(line => line);
    const parsedData = [];
    let imei = "";
    let batteryLevel = "";
    let accStatus = "";
    let alarmStatus = "tracker";

    lines.forEach(line => {
        const parts = line.split(' ');
        if (parts.length < 5 || parts[0] !== '78' || parts[1] !== '78') return;
        
        const packetLength = parseInt(parts[2], 16);
        const protocolNumber = parts[3];
        
        if (protocolNumber === '01' && packetLength >= 12) {
            imei = parts.slice(4, 12).join('');
        }
        
        else if (protocolNumber === '12' && packetLength >= 24) {
            const year = parseInt(parts[4], 16) + 2000;
            const month = parseInt(parts[5], 16);
            const day = parseInt(parts[6], 16);
            const hour = parseInt(parts[7], 16);
            const minute = parseInt(parts[8], 16);
            const second = parseInt(parts[9], 16);
            const gpsSignal = parseInt(parts[10], 16) > 0 ? 'F' : 'A';
            
            const latitudeRaw = parseInt(parts.slice(11, 15).map(hex => hex.padStart(2, '0')).join(''), 16);
            const longitudeRaw = parseInt(parts.slice(15, 19).map(hex => hex.padStart(2, '0')).join(''), 16);
            const speed = parseInt(parts[19], 16);
            const directionByte = parseInt(parts.slice(20, 22).map(hex => hex.padStart(2, '0')).join(''), 16);
            const direction = directionByte & 0x03FF;
            
            const latitudeHemisferio = (directionByte & 0x02) ? 'S' : 'N';
            const longitudeHemisferio = (directionByte & 0x08) ? 'W' : 'E';
            
            const latitude = (latitudeHemisferio === 'S' ? -1 : 1) * (latitudeRaw / 1800000.0);
            const longitude = (longitudeHemisferio === 'W' ? -1 : 1) * (longitudeRaw / 1800000.0);
            
            const timestamp = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ` +
                              `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
            
            parsedData.push({
                gps: gpsSignal,
                latitude: latitude.toFixed(8),
                longitude: longitude.toFixed(8),
                latitudeHemisferio,
                longitudeHemisferio,
                speed,
                imei,
                data: timestamp,
                alarm: alarmStatus,
                acc: accStatus,
                direcao: direction,
                nivelBateria: batteryLevel
            });
        }
        
        else if (protocolNumber === '13' && packetLength >= 6) {
            const voltageLevel = parseInt(parts[4], 16);
        
        
            const batteryMapping = {
                0x00: 0,    
                0x01: 10,   
                0x02: 20,   
                0x03: 40,   
                0x04: 60,   
                0x05: 80,   
                0x06: 100  
            };
        
            batteryLevel = batteryMapping[voltageLevel] ?? voltageLevel
        
            accStatus = (parseInt(parts[5], 16) & 0x02) ? 'on' : 'off';
        }
        
        
        else if (protocolNumber === '16' && packetLength >= 12) {
            const alarmType = parts[parts.length - 4].toUpperCase();
            alarmStatus = alarmCodes[alarmType] ? alarmCodes[alarmType] : (alarmType === '00' ? 'normal' : 'tracker');
        }
    });

    return parsedData;
}

fs.readFile('Rastreador_Pacotes_Recebidos.log', 'utf8', (err, data) => {
    if (err) {
        console.error('Erro ao ler o arquivo:', err);
        return;
    }
    const result = parseTrackerLog(data);
    console.log(JSON.stringify(result, null, 2));
});
