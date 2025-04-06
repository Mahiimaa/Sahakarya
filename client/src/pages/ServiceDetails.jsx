import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import {toast} from "react-toastify";
import axios from "axios";
import Navbar from "../components/Navbar";
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react"
import { useLocation } from 'react-router-dom';

function ServiceDetails() {
  const { _id } = useParams();
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [filteredProviders, setFilteredProviders] = useState([])
  const [providers, setProviders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState("default")
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("search");
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [distanceRadius, setDistanceRadius] = useState(0);
  const [onlyNearby, setOnlyNearby] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [cityOptions, setCityOptions] = useState([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error("Failed to get location:", err);
          toast.error("Please enable location access.");
        }
      );
    }
  }, []);

  function getDistanceInKm(lat1, lon1, lat2, lon2) {
    const toRad = (val) => (val * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  useEffect(() => {
    if (!onlyNearby || !currentUserLocation) return;

    const fetchNearbyProviders = async () => {
      try {
        const { lat, lng } = currentUserLocation;
        const { data } = await axios.get(`${apiUrl}/api/providers/nearby`, {
          params: { lat, lng, radius: 10 },
          headers: { Authorization: `Bearer ${token}` },
        });
        const matched = data.providers.filter((prov) =>
          prov.servicesOffered?.includes(_id)
        );
        setFilteredProviders(matched);
        setSearchQuery("");
        setDistanceRadius(0);
        setSortBy("default");
      } catch (err) {
        console.error("Error fetching nearby providers:", err);
      }
    };

    fetchNearbyProviders();
  }, [onlyNearby, currentUserLocation]);


  useEffect(() => {
    if (query) {
      setSearchQuery(query);
    }
  }, [query]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(data);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

  const fetchUserBookings = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/api/bookings/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserBookings(data.bookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
    }
  };

  fetchCurrentUser();
  fetchUserBookings();
}, [apiUrl]);

  useEffect(() => {
    console.log("Service ID:", _id);
    const fetchServiceDetails = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/api/services/${_id}`,{
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const validProviders = (data.providers || []).filter(
            (prov) =>
              prov.serviceDetail &&
              prov.serviceDetail.title &&
              prov.serviceDetail.description &&
              prov.serviceDetail.duration &&
              prov.serviceDetail.timeCredits
          );          
        setService(data.service);
        setProviders(validProviders);
        setFilteredProviders(validProviders);
      } catch (error) {
        console.error("Error fetching service details:", error);
      }
    };
    fetchServiceDetails();
  }, [_id, apiUrl]);

  useEffect(() => {
    if (!providers.length) return
    let filtered = providers
      .map((provider) => {
        if (
          currentUserLocation &&
          provider.location?.coordinates?.length === 2
        ) {
          const [providerLng, providerLat] = provider.location.coordinates;
          const distance = getDistanceInKm(
            currentUserLocation.lat,
            currentUserLocation.lng,
            providerLat,
            providerLng
          );
          provider.distanceKm = distance;
        }
        return provider;
      })
      .filter((provider) => {
        console.log("Provider Address:", provider.address);
        if (
          currentUser?._id === provider._id ||
          !provider.serviceDetail ||
          !provider.serviceDetail.title ||
          !provider.serviceDetail.description ||
          !provider.serviceDetail.duration ||
          !provider.serviceDetail.timeCredits
        ) {
          return false;
        }

        const matchesSearch =
          provider.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          provider.serviceDetail.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          provider.serviceDetail.description?.toLowerCase().includes(searchQuery.toLowerCase());

          const normalize = (str) => str.toLowerCase().trim();
          const matchesCity =
          !cityFilter ||
          (provider.address &&
            normalize(provider.address).includes(normalize(cityFilter)));


        if (
          distanceRadius > 0 &&
          provider.distanceKm !== undefined &&
          provider.distanceKm > distanceRadius
        ) {console.log(
          `${provider.username} excluded: ${provider.distanceKm.toFixed(2)}km > ${distanceRadius}km`
        );
          return false;
        }

        return matchesSearch && matchesCity;
      });
    if (sortBy === "creditsLow") {
      filtered = [...filtered].sort((a, b) => (a.serviceDetail?.timeCredits || 0) - (b.serviceDetail?.timeCredits || 0))
    } else if (sortBy === "creditsHigh") {
      filtered = [...filtered].sort((a, b) => (b.serviceDetail?.timeCredits || 0) - (a.serviceDetail?.timeCredits || 0))
    } else if (sortBy === "durationLow") {
      filtered = [...filtered].sort((a, b) => (a.serviceDetail?.duration || 0) - (b.serviceDetail?.duration || 0))
    } else if (sortBy === "durationHigh") {
      filtered = [...filtered].sort((a, b) => (b.serviceDetail?.duration || 0) - (a.serviceDetail?.duration || 0))
    }
    else if (sortBy === "distance") {
      filtered = [...filtered].sort((a, b) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity));
    }
    

    setFilteredProviders(filtered)
  }, [providers, searchQuery, sortBy, currentUser,  distanceRadius, currentUserLocation, cityFilter])

  const handleRequestService = async (provider) => {
    if (!currentUser) {
      toast.error("User data not loaded. Try again.");
      return;
    }

    const existingRequest = userBookings.find(
      (booking) => booking.service === service._id && booking.status !== "completed"
    );

    if (!provider.serviceDetail) {
      toast.error("Service details not available.")
      return
    }

    if (existingRequest) {
      toast.error("You have already requested this service.");
      return;
    }

    if (currentUser.timeCredits < provider.serviceDetail.timeCredits) {
      toast.error("Not enough time credits to request this service.");
      return;
    }

    try {
      await axios.post(
        `${apiUrl}/api/bookings`,
        { serviceId: service._id, providerId: provider._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Service requested successfully!");
      const { data } = await axios.get(`${apiUrl}/api/bookings/user`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUserBookings(data.bookings)
    } catch (error) {
      console.error(error.response?.data?.error || "Error requesting service");
      toast.error(error.response?.data?.error || "Error requesting service");
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch("/nepal-cities.json");
        const data = await response.json();
        setCityOptions(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error("Failed to load cities:", err);
      }
    };
  
    fetchCities();
  }, []);
  

  return (
    <div className="flex flex-col min-h-screen bg-screen font-poppins">
      <Navbar />
      <div className="flex flex-col px-4 sm:px-6 md:px-8 lg:px-16 xl:px-28 py-4">
        <div className="flex items-center">
          <NavLink to="/explore" className="flex items-center hover:text-p p-2 rounded-full hover:bg-light-grey md:hidden">
            <ArrowLeft className="w-6 h-6" />
            <span className="sr-only">Back to Explore</span>
          </NavLink>
          <div className="ml-2 md:ml-0">
            {service && <h1 className="text-h2 md:text-h1 font-semi-bold">{service.serviceName}</h1>}
          </div>
        </div>

        <div className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-h3 font-body">Available Providers</h2>

            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
              <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search providers..."
                  className="pl-10 p-2 w-full border rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className="flex items-center justify-center gap-2 p-2 border rounded-lg hover:bg-light-grey"
                  onClick={toggleFilters}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Sort</span>
                </button>

                {currentUserLocation && (
                  <div className="flex items-center gap-2">
                    <select
                      className="border rounded-lg p-2 text-sm"
                      value={distanceRadius}
                      onChange={(e) => setDistanceRadius(Number.parseFloat(e.target.value))}
                      aria-label="Filter by distance"
                    >
                      <option value={0}>All distances</option>
                      <option value={5}>Within 5km</option>
                      <option value={10}>Within 10km</option>
                      <option value={20}>Within 20km</option>
                    </select>
                  </div>
                )}
                  <div className="flex items-center gap-2">
                  <select
                    className="border rounded-lg p-2 text-sm max-h-60 overflow-y-auto"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    aria-label="Filter by city"
                    style={{ maxHeight: "38px" }}
                  >
                    <option value="">All cities</option>
                    {cityOptions.map((city, index) => (
                      <option key={index} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          {showFilters && (
            <div className="bg-white p-4 rounded-lg shadow-md mb-4 border border-dark-grey">
              <h3 className="font-semi-bold mb-2">Sort by:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  className={`p-2 rounded-lg border ${sortBy === "default" ? "bg-p text-white" : "bg-white"}`}
                  onClick={() => setSortBy("default")}
                >
                  Default
                </button>
                <button
                  className={`p-2 rounded-lg border ${sortBy === "creditsLow" ? "bg-p text-white" : "bg-white"}`}
                  onClick={() => setSortBy("creditsLow")}
                >
                  Credits: Low to High
                </button>
                <button
                  className={`p-2 rounded-lg border ${sortBy === "creditsHigh" ? "bg-p text-white" : "bg-white"}`}
                  onClick={() => setSortBy("creditsHigh")}
                >
                  Credits: High to Low
                </button>
                <button
                  className={`p-2 rounded-lg border ${sortBy === "durationLow" ? "bg-p text-white" : "bg-white"}`}
                  onClick={() => setSortBy("durationLow")}
                >
                  Duration: Low to High
                </button>
                <button
                  className={`p-2 rounded-lg border ${sortBy === "durationHigh" ? "bg-p text-white" : "bg-white"}`}
                  onClick={() => setSortBy("durationHigh")}
                >
                  Duration: High to Low
                </button>
                <button
                  className={`p-2 rounded-lg border ${sortBy === "distance" ? "bg-p text-white" : "bg-white"}`}
                  onClick={() => setSortBy("distance")}
                >
                  Distance: Near to Far
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4 mt-4">
            {filteredProviders.length > 0 ? (
              filteredProviders.map((provider) => (
                <div
                  key={provider._id}
                  className="p-2 sm:p-4 border border-dark-grey rounded-lg bg-white shadow-md hover:shadow-xl transition-all duration-200 w-full hover:-translate-y-1.5 flex flex-col h-full"
                >
                  {provider.serviceDetail ? (
                    <div
                      className="p-1 sm:p-2 flex-grow cursor-pointer"
                      onClick={() => navigate(`/provider-details/${provider._id}?serviceId=${service._id}`)}
                    >
                      {provider.serviceDetail.image && (
                        <img
                          src={
                            provider.serviceDetail.image.startsWith("http")
                              ? provider.serviceDetail.image
                              : `${apiUrl}${provider.serviceDetail.image}`
                          }
                          alt="Service"
                          className="w-full h-28 sm:h-40 object-cover rounded-md"
                        />
                      )}

                      <div className="flex items-center gap-2 sm:gap-4 py-1 sm:py-2">
                        {provider.profilePicture && (
                          <img
                            src={`${apiUrl}${provider.profilePicture}`}
                            alt="Profile"
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <h3 className="font-bold text-sm sm:text-base">{provider.username}</h3>
                        {provider.distanceKm !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">{provider.distanceKm.toFixed(1)} km away</p>
                        )}
                      </div>

                      <h4 className="font-semi-bold text-h3">{provider.serviceDetail.title}</h4>
                      <p className="text-h3 line-clamp-2 hover:underline">{provider.serviceDetail.description}</p>
                      <div className="flex justify-between mt-2">
                        <span className="font-semi-bold text-h3">{provider.serviceDetail.duration || "N/A"} hours</span>
                        <span className="font-semi-bold text-h3">
                          {provider.serviceDetail.timeCredits || "N/A"} credits
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No additional details provided.</p>
                  )}

                  <button
                    className="text-p p-2 border border-p rounded-lg w-full hover:bg-p hover:text-white mt-4 transition-colors"
                    onClick={() => handleRequestService(provider)}
                    disabled={
                      !provider.serviceDetail ||
                      userBookings.some(
                        (booking) => booking.service === service._id && booking.status !== "completed",
                      ) ||
                      (provider.serviceDetail && currentUser?.timeCredits < provider.serviceDetail.timeCredits)
                    }
                  >
                    {!provider.serviceDetail
                      ? "Details Unavailable"
                      : userBookings.some(
                            (booking) => booking.service === service._id && booking.status !== "completed",
                          )
                        ? "Already Requested"
                        : provider.serviceDetail && currentUser?.timeCredits < provider.serviceDetail.timeCredits
                          ? "Insufficient Credits"
                          : "Request Service"}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 col-span-full">No providers available for this service.</p>
            )}
          </div>

          {filteredProviders.length === 0 && providers.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No providers match your search criteria.</p>
              <button
                className="mt-4 text-p hover:underline"
                onClick={() => {
                  setSearchQuery("")
                  setSortBy("default")
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServiceDetails;
