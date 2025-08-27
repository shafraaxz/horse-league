// components/players/PlayerRegistrationForm.js - Fixed to properly register players to league market
import React, { useState } from 'react';
import { Upload, User, Calendar, MapPin, Ruler, Weight, Zap, FileText, DollarSign } from 'lucide-react';

const PlayerRegistrationForm = ({ leagueId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    dateOfBirth: '',
    nationality: '',
    passportNumber: '',
    idNumber: '',
    
    // Physical Information
    height: '',
    weight: '',
    preferredFoot: 'Right',
    
    // Football Information
    position: 'Forward',
    previousClubs: '',
    
    // Contact Information
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    
    // Contract Information
    registrationFee: '',
    contractType: 'full_season',
    medicalCertificate: '',
    
    // Media
    photo: ''
  });
  
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [medicalFile, setMedicalFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, title: 'Personal', icon: User },
    { id: 2, title: 'Physical', icon: Ruler },
    { id: 3, title: 'Football', icon: Zap },
    { id: 4, title: 'Contact', icon: MapPin },
    { id: 5, title: 'Registration', icon: FileText }
  ];

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          newErrors.name = 'Player name is required';
        }
        
        if (formData.dateOfBirth) {
          const birthDate = new Date(formData.dateOfBirth);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 16 || age > 50) {
            newErrors.dateOfBirth = 'Player age should be between 16 and 50';
          }
        }
        break;
      
      case 2:
        if (formData.height && (formData.height < 150 || formData.height > 220)) {
          newErrors.height = 'Height should be between 150cm and 220cm';
        }
        if (formData.weight && (formData.weight < 50 || formData.weight > 120)) {
          newErrors.weight = 'Weight should be between 50kg and 120kg';
        }
        break;
      
      case 4:
        if (formData.email && formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    let allValid = true;
    for (let i = 1; i <= 4; i++) {
      if (!validateStep(i)) {
        allValid = false;
      }
    }
    return allValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photo: 'Please select a valid image file' }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'Image file must be less than 5MB' }));
        return;
      }

      setPhotoFile(file);
      setErrors(prev => ({ ...prev, photo: '' }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMedicalFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, medicalCertificate: 'File must be less than 10MB' }));
        return;
      }

      setMedicalFile(file);
      setErrors(prev => ({ ...prev, medicalCertificate: '' }));
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      for (let i = 1; i <= 4; i++) {
        if (!validateStep(i)) {
          setCurrentStep(i);
          return;
        }
      }
      return;
    }

    setLoading(true);

    try {
      let photoUrl = '';
      let medicalUrl = '';

      // Upload photo if provided
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('image', photoFile);
        photoFormData.append('type', 'player-photo');

        const photoResponse = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: photoFormData,
        });

        if (photoResponse.ok) {
          const photoResult = await photoResponse.json();
          photoUrl = photoResult.secure_url;
        }
      }

      // Upload medical certificate if provided
      if (medicalFile) {
        const medicalFormData = new FormData();
        medicalFormData.append('file', medicalFile);
        medicalFormData.append('type', 'medical-certificate');

        const medicalResponse = await fetch('/api/upload/document', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: medicalFormData,
        });

        if (medicalResponse.ok) {
          const medicalResult = await medicalResponse.json();
          medicalUrl = medicalResult.secure_url;
        }
      }

      // ✅ FIXED: Prepare player data for LEAGUE MARKET registration
      const playerData = {
        // Basic required fields
        name: formData.name.trim(),
        position: formData.position || 'Forward',
        preferredFoot: formData.preferredFoot || 'Right',
        contractType: formData.contractType || 'full_season',
        
        // ✅ CRITICAL: Register to LEAGUE MARKET (not team!)
        league: leagueId,
        
        // ✅ FIXED: Player starts as FREE AGENT in market
        team: null,
        currentTeam: null,
        assignedToTeam: false,
        
        // ✅ FIXED: Market status
        status: 'available', // available for transfer
        registrationStatus: 'approved',
        isActive: true,
        isAvailableForTransfer: true,
        marketStatus: 'available',
        
        // Registration details
        registrationDate: new Date(),
        registeredBy: 'league_admin',
        
        // ✅ No jersey number until assigned to team
        jerseyNumber: null,
        
        // Transfer history starts empty
        transferHistory: [],
        
        // Statistics start at zero
        statistics: {
          matchesPlayed: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          saves: 0,
          cleanSheets: 0,
          minutesPlayed: 0
        }
      };

      // Add optional fields only if they have values
      if (photoUrl) playerData.photo = photoUrl;
      if (medicalUrl) playerData.medicalCertificate = medicalUrl;
      if (formData.dateOfBirth) playerData.dateOfBirth = new Date(formData.dateOfBirth);
      if (formData.nationality?.trim()) playerData.nationality = formData.nationality.trim();
      if (formData.passportNumber?.trim()) playerData.passportNumber = formData.passportNumber.trim();
      if (formData.idNumber?.trim()) playerData.idNumber = formData.idNumber.trim();
      if (formData.height) playerData.height = parseInt(formData.height);
      if (formData.weight) playerData.weight = parseInt(formData.weight);
      if (formData.previousClubs?.trim()) playerData.previousClubs = formData.previousClubs.trim();
      if (formData.email?.trim()) playerData.email = formData.email.trim();
      if (formData.phone?.trim()) playerData.phone = formData.phone.trim();
      if (formData.address?.trim()) playerData.address = formData.address.trim();
      if (formData.emergencyContact?.trim()) playerData.emergencyContact = formData.emergencyContact.trim();
      if (formData.emergencyPhone?.trim()) playerData.emergencyPhone = formData.emergencyPhone.trim();
      if (formData.registrationFee) playerData.registrationFee = parseFloat(formData.registrationFee);

      console.log('🔥 Submitting player to LEAGUE MARKET:', playerData);
      
      // Submit to backend API
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(playerData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register player');
      }

      const createdPlayer = await response.json();
      console.log('✅ Player registered to market successfully:', createdPlayer);
      
      await onSubmit(createdPlayer);
    } catch (error) {
      console.error('❌ Error registering player to market:', error);
      setErrors({ submit: error.message || 'Failed to register player to market' });
    } finally {
      setLoading(false);
    }
  };

  const age = calculateAge(formData.dateOfBirth);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Register Player to League Market</h2>
        <p className="text-sm text-gray-600">Step {currentStep} of {steps.length}</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
          <p className="text-sm text-blue-800">
            <strong>🏪 League Market Registration:</strong> Player will be registered to the league market as a free agent available for transfer. 
            Team assignment and jersey number will be handled separately through the transfer system.
          </p>
        </div>
        {leagueId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2">
            <p className="text-xs text-green-700">✅ Registering for league market: {leagueId}</p>
          </div>
        )}
      </div>

      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium
                  ${isActive ? 'bg-blue-600 text-white' : 
                    isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  <StepIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <span className="text-xs mt-1 text-center hidden sm:block">{step.title}</span>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block absolute h-0.5 w-16 mt-5 ml-16 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Player Photo */}
            <div className="text-center mb-6">
              <div className="mb-3">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Player photo preview"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto flex items-center justify-center bg-gray-200 border-4 border-gray-200">
                    <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer inline-flex items-center px-3 py-2 sm:px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Upload Photo (Optional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              {errors.photo && <p className="text-red-500 text-sm mt-1">{errors.photo}</p>}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter player's full name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date of Birth (Optional)
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {age && <p className="text-sm text-gray-600 mt-1">Age: {age} years</p>}
                {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Nationality (Optional)
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Brazilian, English"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passport Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="passportNumber"
                    value={formData.passportNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Passport number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="National ID number"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Physical Information */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Ruler className="w-5 h-5 mr-2" />
              Physical Information (Optional)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  min="150"
                  max="220"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.height ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 180"
                />
                {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  min="50"
                  max="120"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.weight ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 75"
                />
                {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Zap className="w-4 h-4 inline mr-1" />
                  Preferred Foot
                </label>
                <select
                  name="preferredFoot"
                  value={formData.preferredFoot}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Left">Left</option>
                  <option value="Right">Right</option>
                  <option value="Both">Both</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Football Information */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Football Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Position
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Goalkeeper">Goalkeeper</option>
                  <option value="Defender">Defender</option>
                  <option value="Midfielder">Midfielder</option>
                  <option value="Forward">Forward</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  This can be updated later during team assignment
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>📝 Note:</strong> Jersey number will be assigned when the player is transferred to a team. 
                  For now, they will be registered as a free agent available in the league market.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Previous Clubs (Optional)
                </label>
                <textarea
                  name="previousClubs"
                  value={formData.previousClubs}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="List previous clubs/teams (optional)"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Contact Information */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information (Optional)</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="player@email.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full address"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Emergency contact name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Registration Details */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Registration Details (Optional)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Registration Fee
                </label>
                <input
                  type="number"
                  name="registrationFee"
                  value={formData.registrationFee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Type
                </label>
                <select
                  name="contractType"
                  value={formData.contractType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full_season">Full Season</option>
                  <option value="half_season">Half Season</option>
                  <option value="temporary">Temporary</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Certificate (Optional)
              </label>
              <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors w-full sm:w-auto justify-center">
                <Upload className="w-4 h-4 mr-2" />
                Upload Medical Certificate
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleMedicalFileChange}
                  className="hidden"
                />
              </label>
              {medicalFile && (
                <p className="text-sm text-green-600 mt-2">
                  ✅ {medicalFile.name} selected
                </p>
              )}
              {errors.medicalCertificate && (
                <p className="text-red-500 text-sm mt-1">{errors.medicalCertificate}</p>
              )}
            </div>

            {/* Final Registration Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">🎯 Registration Summary</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>{formData.name || 'Player'}</strong> will be registered to the league market as a free agent</p>
                <p>Position: <strong>{formData.position}</strong></p>
                <p>Status: <strong>Available for Transfer</strong></p>
                <p>Jersey Number: <strong>Will be assigned when transferred to team</strong></p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t space-x-2">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                Previous
              </button>
            )}
          </div>

          <div>
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Registering to Market...
                  </span>
                ) : (
                  '🏪 Register to League Market'
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default PlayerRegistrationForm;