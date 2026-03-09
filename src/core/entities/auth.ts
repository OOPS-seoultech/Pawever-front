export type AuthSession = {
  accessToken: string;
  isNewUser: boolean;
  selectedPetId: number | null;
  userId: number;
};
