import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { IoClose } from "react-icons/io5";
import "react-datepicker/dist/react-datepicker.css";

const Schedule = ({ isOpen, onClose, onSchedule }) => {
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [serviceDuration, setServiceDuration] = useState(1);

  const handleSchedule = () => {
    if (!scheduleDate || serviceDuration <= 0) {
      alert("Please enter valid schedule details.");
      return;
    }
    onSchedule(scheduleDate, serviceDuration);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white p-6 border border-dark-grey rounded-lg shadow-lg w-96 relative">
        <button className="absolute top-3 right-3 text-grey" onClick={onClose}>
        <IoClose size={24} />
        </button>
        <h2 className="text-h2 font-semi-bold mb-4">Schedule Service</h2>
        <label className="block mb-2">Select Schedule Date:</label>
        <DatePicker
          selected={scheduleDate}
          onChange={(date) => setScheduleDate(date)}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={30}
          dateFormat="MMMM d, yyyy h:mm aa"
          className="w-full p-2 border rounded"
        />
        <label className="block mt-4 mb-2">Service Duration (in hours):</label>
        <input
          type="number"
          value={serviceDuration}
          onChange={(e) => setServiceDuration(parseInt(e.target.value, 10))}
          min="1"
          className="w-full p-2 border rounded"
        />

        <div className="flex justify-end mt-4">
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-p text-white px-4 py-2 rounded"
            onClick={handleSchedule}
          >
            Confirm Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
