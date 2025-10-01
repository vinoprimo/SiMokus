<?php
// app/Http/Controllers/AdminController.php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function index()
    {
        // Ambil semua user dengan role admin
        return User::where('role', 'admin')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|min:6',
        ]);

        $admin = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'admin',
        ]);

        return response()->json($admin, 201);
    }

    public function show(User $admin)
    {
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Not an admin'], 404);
        }

        return $admin;
    }

    public function update(Request $request, User $admin)
    {
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Not an admin'], 404);
        }

        $request->validate([
            'name'     => 'sometimes|string|max:255',
            'email'    => 'sometimes|email|unique:users,email,' . $admin->id,
            'password' => 'sometimes|min:6',
        ]);

        $data = $request->only(['name', 'email']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $admin->update($data);

        return $admin;
    }

    public function destroy(User $admin)
    {
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Not an admin'], 404);
        }

        $admin->delete();
        return response()->noContent();
    }
}
