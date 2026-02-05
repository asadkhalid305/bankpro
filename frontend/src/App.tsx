  const handleMasterDelete = async (originalIndex: number | number[]) => {
    const indicesToDelete = Array.isArray(originalIndex) ? originalIndex : [originalIndex];
    if (!window.confirm(`Are you sure you want to delete ${indicesToDelete.length} transaction(s) from your master statement?`)) return;
    try {
      const response = await fetch(`/api/master/bulk_delete`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indices: indicesToDelete })
      });
      if (response.ok) {
        setSelectedMasterRows(new Set()); // Clear selection
        fetchMasterData(); // Refresh master data after deletion
      } else {
        const errorData = await response.json();
        alert(`Failed to delete master row(s): ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert("Failed to delete master row(s): Network error");
    }
  };