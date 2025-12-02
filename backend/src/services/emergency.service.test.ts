import { EmergencyDispatchService } from './emergency.service';

describe('EmergencyDispatchService', () => {
  describe('detectEmergency', () => {
    it('should detect chest pain emergency (Q0=3)', () => {
      const result = EmergencyDispatchService.detectEmergency([3, 0, 0, 0, 0]);
      expect(result.isEmergency).toBe(true);
      expect(result.escalationType).toBe('CHEST_PAIN');
    });

    it('should detect trauma emergency (Q3=1 + Q1>=2)', () => {
      const result = EmergencyDispatchService.detectEmergency([0, 2, 0, 1, 0]);
      expect(result.isEmergency).toBe(true);
      expect(result.escalationType).toBe('TRAUMA');
    });

    it('should detect severe symptoms (Q1=3 + Q2>=2)', () => {
      const result = EmergencyDispatchService.detectEmergency([0, 3, 2, 0, 0]);
      expect(result.isEmergency).toBe(true);
      expect(result.escalationType).toBe('SEVERE_SYMPTOMS');
    });

    it('should detect loss of consciousness (Q4=1)', () => {
      const result = EmergencyDispatchService.detectEmergency([0, 0, 0, 0, 1]);
      expect(result.isEmergency).toBe(true);
      expect(result.escalationType).toBe('CRITICAL_CONDITION');
    });

    it('should detect severe breathing distress (Q2=3)', () => {
      const result = EmergencyDispatchService.detectEmergency([0, 0, 3, 0, 0]);
      expect(result.isEmergency).toBe(true);
      expect(result.escalationType).toBe('CRITICAL_CONDITION');
    });

    it('should not detect emergency for low scores', () => {
      const result = EmergencyDispatchService.detectEmergency([0, 0, 0, 0, 0]);
      expect(result.isEmergency).toBe(false);
    });

    it('should not detect emergency for moderate symptoms', () => {
      const result = EmergencyDispatchService.detectEmergency([1, 1, 1, 0, 0]);
      expect(result.isEmergency).toBe(false);
    });

    it('should not detect emergency for trauma without symptoms', () => {
      const result = EmergencyDispatchService.detectEmergency([0, 0, 0, 1, 0]);
      expect(result.isEmergency).toBe(false);
    });

    it('should handle incomplete answer arrays', () => {
      const result = EmergencyDispatchService.detectEmergency([3]);
      expect(result.isEmergency).toBe(true);
      expect(result.escalationType).toBe('CHEST_PAIN');
    });

    it('should handle invalid input gracefully', () => {
      const result = EmergencyDispatchService.detectEmergency([]);
      expect(result.isEmergency).toBe(false);
    });
  });
});
