import React, { useState } from 'react';

interface Skill {
  id: number;
  name: string;
  description: string;
}

const SkillCreator: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateSkill = () => {
    if (name.trim() && description.trim()) {
      const newSkill: Skill = {
        id: Date.now(),
        name: name.trim(),
        description: description.trim(),
      };
      setSkills([...skills, newSkill]);
      setName('');
      setDescription('');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Skill Creator</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Skill Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-2"
        />
        <textarea
          placeholder="Skill Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-2"
        />
        <button
          onClick={handleCreateSkill}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Skill
        </button>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Created Skills</h3>
        <ul className="list-disc list-inside">
          {skills.map((skill) => (
            <li key={skill.id} className="mb-1">
              <strong>{skill.name}</strong>: {skill.description}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SkillCreator;