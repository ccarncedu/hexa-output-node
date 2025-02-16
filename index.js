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

