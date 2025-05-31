import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Heart, ArrowLeft } from "lucide-react";
import NativeBottomNavigation from "@/components/mobile/NativeBottomNavigation";

// Pet interface
interface Pet {
  id: number;
  name: string;
  species: string;
  size: string;
  age: string;
  location: string;
  description: string;
  status: string;
  contactPhone: string;
  image?: string;
}

export default function PetDetailsPage() {
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, navigate] = useLocation();
  const [match, params] = useRoute<{ id: string }>("/pet-details/:id");

  // Fetch pet data by ID from localStorage (no backend)
  useEffect(() => {
    const petId = params?.id;
    if (!match || !petId) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    const fetchPetDetails = () => {
      try {
        setIsLoading(true);
        // Read from localStorage
        const raw = localStorage.getItem("yaopets_local_pets");
        if (!raw) throw new Error("No pets found");
        const allPets: any[] = JSON.parse(raw);
        const foundPet = allPets.find(
          (p) => String(p.id) === String(petId)
        );
        if (!foundPet) throw new Error("Pet not found");

        // Normalize/enrich properties
        const speciesDisplay: Record<string, string> = {
          dog: "Dog",
          cat: "Cat",
          other: "Other",
          Cachorro: "Dog",
          Gato: "Cat",
          Outro: "Other"
        };
        const sizeDisplay: Record<string, string> = {
          small: "Small",
          medium: "Medium",
          large: "Large",
          Pequeno: "Small",
          Médio: "Medium",
          Grande: "Large"
        };
        const ageDisplay: Record<string, string> = {
          puppy: "Puppy",
          adult: "Adult",
          senior: "Senior",
          Filhote: "Puppy",
          Adulto: "Adult",
          Idoso: "Senior"
        };

        const petDetails: Pet = {
          id: foundPet.id,
          name: foundPet.petName || foundPet.name || "Pet for adoption",
          species: speciesDisplay[foundPet.petSpecies] || speciesDisplay[foundPet.species] || foundPet.petSpecies || foundPet.species || "Not specified",
          size: sizeDisplay[foundPet.petSize] || sizeDisplay[foundPet.size] || foundPet.petSize || foundPet.size || "Medium",
          age: ageDisplay[foundPet.petAge] || ageDisplay[foundPet.age] || foundPet.petAge || foundPet.age || "Not specified",
          location: foundPet.petLocation || foundPet.location || "Not informed",
          description: foundPet.description || foundPet.content || "New pet for adoption",
          status: foundPet.petStatus === "adoption" || foundPet.status === "adoption" || foundPet.status === "Disponível" ? "Available"
            : foundPet.petStatus === "lost" ? "Lost"
            : foundPet.petStatus === "found" ? "Found"
            : "Available",
          contactPhone: foundPet.contactPhone || "(xx) xxxxx-xxxx",
          image: foundPet.photo || (foundPet.mediaUrls && foundPet.mediaUrls[0])
        };

        if (!isCancelled) {
          setPet(petDetails);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error loading pet details:', error);
          setPet(null);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchPetDetails();
    return () => {
      isCancelled = true;
    };
  }, [params?.id, match]);

  const handleGoBack = () => {
    navigate("/pets");
  };

  const handleAdoptPet = () => {
    if (!pet) return;
    // Pre-filled message for WhatsApp (or just alert for demo)
    const message = `I want this lovely pet! 🐾
Name: ${pet.name}
Description: ${pet.description}
Location: ${pet.location}`;
    // Simulate sending to internal chat/inbox
    alert("Message sent to owner's inbox:\n\n" + message);
    // For real, could open WhatsApp or internal chat route
    // window.open(`https://wa.me/${pet.contactPhone}?text=${encodeURIComponent(message)}`, '_blank');
    // navigate(`/chat/${pet.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="container mx-auto p-4 pb-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Pet not found</h1>
          <p className="text-neutral-600 mb-6">The pet you are looking for is not available.</p>
          <Button onClick={handleGoBack}>Back to adoptions</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16 bg-gray-100">
      {/* Hero image */}
      <div className="relative">
        <div className="w-full h-60 bg-gradient-to-b from-emerald-600 to-emerald-700 relative">
          {pet.image ? (
            <img
              src={pet.image}
              alt={pet.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-icons text-white/80 text-8xl">pets</span>
            </div>
          )}
          {/* Back button */}
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-full w-10 h-10 z-10"
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-5 w-5 text-neutral-700" />
          </Button>
        </div>
      </div>
      {/* Main content */}
      <div className="px-4 -mt-3">
        <div className="bg-white rounded-t-xl p-6 shadow-sm">
          <div className="mb-2 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">{pet.name}</h1>
            <Badge className="bg-green-100 text-green-800 border-0 px-3 py-1">
              {pet.status}
            </Badge>
          </div>
          <div className="flex items-center mb-4 text-gray-600">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{pet.location}</span>
          </div>
          <Button
            className="w-full bg-pink-500 hover:bg-pink-600 text-white py-6 rounded-md mb-6 h-12"
            onClick={handleAdoptPet}
          >
            <Heart className="h-5 w-5 mr-2" /> I want to adopt
          </Button>
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <span className="block text-sm font-medium text-gray-600">Species</span>
              <span className="block text-base font-semibold text-gray-800">{pet.species}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <span className="block text-sm font-medium text-gray-600">Size</span>
              <span className="block text-base font-semibold text-gray-800">{pet.size}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <span className="block text-sm font-medium text-gray-600">Age</span>
              <span className="block text-base font-semibold text-gray-800">{pet.age}</span>
            </div>
          </div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">About {pet.name}</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              {pet.description}
            </p>
          </div>
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Adoption information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-700 text-sm">
                  <span className="font-medium">Adoption process:</span> Interview with potential adopter, fill out a form, and sign a responsible adoption agreement.
                </p>
              </div>
              <div>
                <p className="text-gray-700 text-sm">
                  <span className="font-medium">Requirements:</span> Over 18 years old, commitment to the animal's well-being, suitable environment for the pet.
                </p>
              </div>
              <div>
                <p className="text-gray-700 text-sm">
                  <span className="font-medium">Contact:</span> Click the "I want to adopt" button above to start the adoption process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <NativeBottomNavigation />
    </div>
  );
}