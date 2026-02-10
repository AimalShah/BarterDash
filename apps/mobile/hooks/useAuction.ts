import { useEffect, useState } from "react";
import { Auction } from "../types";
import { auctionsService } from "../lib/api/services/auctions";

export function useAuction() {
  const [auctions, setAuctions] = useState<Auction[] | null>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>();

  const fetchAuctions = async () => {
    try {
      const data: Auction[] | null = await auctionsService.findAll();
      setAuctions(data);
    } catch (error: any) {
      setError(error.message || "Failed to fetch auctions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  return {
    error,
    loading,
    auctions,
  };
}
