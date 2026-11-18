<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class TaDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id',
        'user_id',
        'category',
        'title',
        'file_path',
        'file_name',
        'file_size',
        'similarity_score',
        'version',
        'status',
        'reviewed_by',
        'reviewer_notes',
        'reviewed_at',
    ];

    protected $appends = ['file_url'];

    protected function casts(): array
    {
        return [
            'similarity_score' => 'float',
            'reviewed_at' => 'datetime',
        ];
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? Storage::url($this->file_path) : null;
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}