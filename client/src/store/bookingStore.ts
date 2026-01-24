import { create } from 'zustand';

interface Branch {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Professional {
  id: string;
  name: string;
}

interface BookingState {
  selectedBranch: Branch | null;
  selectedService: Service | null;
  selectedProfessional: Professional | null;
  selectedDateTime: Date | null;
  setSelectedBranch: (branch: Branch | null) => void;
  setSelectedService: (service: Service | null) => void;
  setSelectedProfessional: (professional: Professional | null) => void;
  setSelectedDateTime: (dateTime: Date | null) => void;
  clearBooking: () => void;
}

export const useBookingStore = create<BookingState>()((set) => ({
  selectedBranch: null,
  selectedService: null,
  selectedProfessional: null,
  selectedDateTime: null,
  setSelectedBranch: (branch) => set({ selectedBranch: branch }),
  setSelectedService: (service) => set({ selectedService: service }),
  setSelectedProfessional: (professional) => set({ selectedProfessional: professional }),
  setSelectedDateTime: (dateTime) => set({ selectedDateTime: dateTime }),
  clearBooking: () =>
    set({
      selectedBranch: null,
      selectedService: null,
      selectedProfessional: null,
      selectedDateTime: null,
    }),
}));
