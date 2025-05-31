import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddressLink from "@/components/map/AddressLink";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { useAuth } from "@/hooks/useAuth";
import NativeBottomNavigation from "@/components/mobile/NativeBottomNavigation";
import { MapPin, Heart } from "lucide-react";

// Pet type for local data
type Pet = {
  id: number;
  name: string;
  type: string;
  status: "lost" | "found" | "adoption";
  color: string;
  size: string;
  breed: string;
  eyeColor: string;
  address: string;
  description: string;
  ownerId: number;
  ownerName: string;
  lat: number;
  lng: number;
  imageUrl?: string;
};

// Pet characteristics display
function PetCharacteristics({ pet }: { pet: Pet }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
      <div className="flex items-center">
        <span className="material-icons text-neutral-500 text-sm mr-1">category</span>
        <span className="text-neutral-700">{pet.type}</span>
      </div>
      <div className="flex items-center">
        <span className="material-icons text-neutral-500 text-sm mr-1">palette</span>
        <span className="text-neutral-700">{pet.color}</span>
      </div>
      <div className="flex items-center">
        <span className="material-icons text-neutral-500 text-sm mr-1">straighten</span>
        <span className="text-neutral-700">{pet.size}</span>
      </div>
      <div className="flex items-center">
        <span className="material-icons text-neutral-500 text-sm mr-1">pets</span>
        <span className="text-neutral-700">{pet.breed}</span>
      </div>
      <div className="flex items-center">
        <span className="material-icons text-neutral-500 text-sm mr-1">visibility</span>
        <span className="text-neutral-700">{pet.eyeColor}</span>
      </div>
      <div className="flex items-center">
        <span className="material-icons text-neutral-500 text-sm mr-1">location_on</span>
        <AddressLink 
          address={pet.address} 
          lat={pet.lat} 
          lng={pet.lng}
        />
      </div>
    </div>
  );
}

// Card for each pet
function PetCard({ pet, onContact, onMap }: { 
  pet: Pet, 
  onContact: (pet: Pet) => void,
  onMap: (pet: Pet) => void
}) {
  const [, navigate] = useLocation();
  const goToDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/pet-details/${pet.id}`);
  };

  return (
    <Card 
      key={pet.id} 
      className="overflow-hidden border-0 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={goToDetails}
    >
      <CardContent className="p-0">
        <div className="h-48 bg-gradient-to-r from-emerald-500 to-emerald-600 relative overflow-hidden">
          {pet.photo ? (
            <img src={pet.photo} alt={pet.petName} className="w-full h-full object-cover" />
          ) : (
            <span className="material-icons text-white/30 text-8xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">pets</span>
          )}
          <div className="absolute top-3 right-3">
            <Badge className={`${
              pet.petStatus === "lost" 
                ? "bg-orange-100 text-orange-800 border-0" 
                : pet.petStatus === "found"
                  ? "bg-blue-100 text-blue-800 border-0"
                  : "bg-green-100 text-green-800 border-0"
              } px-2 py-1 text-xs font-medium`}
            >
              {pet.petStatus === "lost" 
                ? "Lost" 
                : pet.petStatus === "found" 
                  ? "Found" 
                  : "Available"}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-full w-8 h-8"
            onClick={(e) => {
              e.stopPropagation();
              onMap(pet);
            }}
          >
            <MapPin className="h-4 w-4 text-neutral-700" />
          </Button>
        </div>
        <div className="p-4">
          <div className="mb-3">
            <h3 className="font-bold text-lg text-gray-800">{pet.petName}</h3>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="truncate">{pet.petLocation}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gray-50 p-2 rounded-lg text-center">
              <span className="block text-xs font-medium text-gray-600">Species</span>
              <span className="block text-sm font-semibold text-gray-800">{pet.petSpeciesDisplay}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg text-center">
              <span className="block text-xs font-medium text-gray-600">Size</span>
              <span className="block text-sm font-semibold text-gray-800">{pet.petSizeDisplay}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg text-center">
              <span className="block text-xs font-medium text-gray-600">Age</span>
              <span className="block text-sm font-semibold text-gray-800">{pet.petAgeDisplay}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {pet.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PetsPage() {
  const [activeTab, setActiveTab] = useState("adoption");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { position, getCurrentPosition } = useGeoLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Form states
  const [petLostForm, setPetLostForm] = useState({
    name: "",
    type: "",
    color: "",
    size: "",
    breed: "",
    eyeColor: "",
    address: "",
    description: ""
  });
  const [petFoundForm, setPetFoundForm] = useState({
    type: "",
    color: "",
    size: "",
    breed: "",
    address: "",
    description: ""
  });
  const [lostPetPhoto, setLostPetPhoto] = useState<File | null>(null);
  const [lostPetPhotoPreview, setLostPetPhotoPreview] = useState<string | null>(null);
  const [foundPetPhoto, setFoundPetPhoto] = useState<File | null>(null);
  const [foundPetPhotoPreview, setFoundPetPhotoPreview] = useState<string | null>(null);
  const lostPhotoInputRef = useRef<HTMLInputElement>(null);
  const foundPhotoInputRef = useRef<HTMLInputElement>(null);

  // File select handlers
  const handleLostPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLostPetPhoto(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setLostPetPhotoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const handleFoundPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFoundPetPhoto(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setFoundPetPhotoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    getCurrentPosition();
  }, []);

  // Load pets from localStorage (no backend)
  const [petsData, setPetsData] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // For demo, use localStorage for persistent pet posts (created by user)
    try {
      setIsLoading(true);
      let pets: any[] = [];
      const petsRaw = localStorage.getItem("yaopets_local_pets");
      if (petsRaw) {
        pets = JSON.parse(petsRaw);
        console.log("Loaded pets from localStorage:", pets);
      }
      // Demo data if empty
      if (!pets.length) {
        pets = [
          {
            id: 1,
            name: "Luna",
            type: "Cat",
            status: "adoption",
            color: "Gray",
            size: "Small",
            breed: "Persian",
            eyeColor: "Green",
            address: "Av. Paulista, 1000",
            description: "Playful, vaccinated, spayed, perfect for families.",
            ownerId: 1,
            ownerName: "Alice",
            lat: -23.561684,
            lng: -46.655981,
            imageUrl: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&q=80"
          },
          {
            id: 2,
            name: "Thor",
            type: "Dog",
            status: "adoption",
            color: "Golden",
            size: "Large",
            breed: "Golden Retriever",
            eyeColor: "Brown",
            address: "Rua Augusta, 200",
            description: "Energetic, loves walks. Looking for an active owner.",
            ownerId: 2,
            ownerName: "Bob",
            lat: -23.560100,
            lng: -46.650000,
            imageUrl: "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800&q=80"
          },
          {
            id: 3,
            name: "Max",
            type: "Dog",
            status: "lost",
            color: "Black",
            size: "Medium",
            breed: "Mutt",
            eyeColor: "Brown",
            address: "Praça da Sé",
            description: "Lost last week, wearing red collar. Reward offered.",
            ownerId: 3,
            ownerName: "Clara",
            lat: -23.550520,
            lng: -46.633308,
            imageUrl: "https://images.unsplash.com/photo-1502672023488-70e25813f145?w=800&q=80"
          },
          {
            id: 4,
            name: "Bella",
            type: "Dog",
            status: "found",
            color: "White",
            size: "Small",
            breed: "Poodle",
            eyeColor: "Black",
            address: "Rua das Flores, 500",
            description: "Found near the park, friendly and well-groomed.",
            ownerId: 4,
            ownerName: "David",
            lat: -23.555000,
            lng: -46.640000,
            imageUrl: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=687&auto=format&fit=crop"
          }
        ];
      }
      setPetsData(pets);
    } catch (err) {
      setPetsData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filtered pets per tab
  const filteredPets = petsData.filter(pet => {
    if (activeTab === "lost") {
      return pet.petStatus === "lost";
    } else if (activeTab === "found") {
      return pet.petStatus === "found";
    } else if (activeTab === "adoption") {
      return pet.petStatus === "adoption";
    }
    return false;
  });

  // Contact owner (demo: alert)
  const handleContactOwner = (pet: Pet) => {
    alert(`Contacting the owner of ${pet.petName} (${pet.ownerName})`);
  };

  // Open map
  const handleOpenMap = (pet: Pet) => {
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pet.address)}`;
    window.open(mapUrl, '_blank');
    toast({
      title: "Opening map",
      description: `Navigating to ${pet.address}`,
    });
  };

  const goToAdoption = () => {
    setLocation("/donations");
  };

  return (
    <div className="pb-16">
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Pets</h1>
          <p className="text-neutral-600 mt-1">
            Lost, found, and for adoption
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-black to-secondary rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="font-medium text-white mb-1">Saw a lost animal or found a pet?</h3>
              <p className="text-white/90 text-sm">
                Help the community by registering lost or found animals so they can be reunited with their families.
              </p>
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90 flex items-center"
              onClick={() => setLocation('/new-pet')}
            >
              <span className="material-icons text-sm mr-1">add</span>
              Register pet
            </Button>
          </div>
        </div>

        <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
          <TabsList className="flex w-full mb-6 p-1 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl">
            <TabsTrigger 
              value="adoption" 
              className="flex-1 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="material-icons text-sm">favorite</span>
                <span>For Adoption</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="lost" 
              className="flex-1 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="material-icons text-sm">search</span>
                <span>Lost</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="found" 
              className="flex-1 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="material-icons text-sm">pets</span>
                <span>Found</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-500">Loading pets...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 text-center">
              <p className="mb-2 font-medium">Could not load pets</p>
              <p className="text-sm">{error}</p>
              <Button
                variant="outline"
                className="mt-4 border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => window.location.reload()}
              >
                Try again
              </Button>
            </div>
          ) : (
            <>
              <TabsContent value="lost" className="mt-0">
                {filteredPets.length === 0 ? (
                  <div className="bg-red-50 rounded-lg p-6 text-center">
                    <div className="text-red-500 flex justify-center mb-3">
                      <span className="material-icons text-4xl">search</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No lost pets found</h3>
                    <p className="text-gray-600">
                      There are no lost pets registered at the moment.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPets.map(pet => (
                      <PetCard 
                        key={pet.id} 
                        pet={pet} 
                        onContact={handleContactOwner}
                        onMap={handleOpenMap}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="found" className="mt-0">
                {filteredPets.length === 0 ? (
                  <div className="bg-blue-50 rounded-lg p-6 text-center">
                    <div className="text-blue-500 flex justify-center mb-3">
                      <span className="material-icons text-4xl">pets</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No found pets registered</h3>
                    <p className="text-gray-600">
                      There are no found pets at the moment.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPets.map(pet => (
                      <PetCard 
                        key={pet.id} 
                        pet={pet} 
                        onContact={handleContactOwner}
                        onMap={handleOpenMap}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="adoption" className="mt-0">
                {filteredPets.length === 0 ? (
                  <div className="bg-green-50 rounded-lg p-6 text-center">
                    <div className="text-green-500 flex justify-center mb-3">
                      <span className="material-icons text-4xl">favorite</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No pets for adoption</h3>
                    <p className="text-gray-600 mb-4">
                      There are no pets available for adoption at the moment. Use the "Register pet" button to add a pet for adoption.
                    </p>
                    <Button 
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => setReportDialogOpen(true)}
                    >
                      Register pet for adoption
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPets.map(pet => (
                      <PetCard 
                        key={pet.id} 
                        pet={pet} 
                        onContact={handleContactOwner}
                        onMap={handleOpenMap}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
      <NativeBottomNavigation />
    </div>
  );
}